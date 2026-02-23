/**
 * OpenRouter API Service
 * Backend service for calling Xiaomi MiMo-V2-Flash via OpenRouter
 * IMPORTANT: This is backend-only code. API key is kept secure.
 */

import OpenAI from 'openai';
import { ProgramData, ChatMessage, HistoricalReview, Citation } from './types';
import { buildAccjcContext, getMappedStandards, getStandardById, getComplianceChecklist, getKeyQuestions } from './accjc-standards';
import { retrieveContext, formatRAGContext, formatRAGContextWithCitations } from './rag-service';

const MODEL = 'xiaomi/mimo-v2-flash';

// Lazily initialize OpenRouter client so builds don't fail when env vars aren't present.
function getClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set.');
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  });
}

/**
 * Generate realistic program data using AI
 * @param programName - Name of the program
 * @returns ProgramData with enrollment, demographics, and assessment metrics
 */
export async function generateProgramData(programName: string): Promise<ProgramData> {
  const prompt = `Generate realistic, aggregate-level program review data for a community college '${programName}' program.
  Include metrics like: enrollment numbers for the last 3 years (e.g., 2021, 2022, 2023), completion rates (as a number between 0 and 1),
  job placement rates for CTE programs (as a number between 0 and 1), student demographics as percentages (summing to 100),
  and a brief summary of 2-3 program strengths and 2-3 weaknesses.

  Return ONLY a valid JSON object with this exact structure:
  {
    "programName": "string",
    "summary": { "strengths": ["string"], "weaknesses": ["string"] },
    "enrollment": [{ "year": number, "count": number }],
    "completionRate": number,
    "jobPlacementRate": number,
    "demographics": { "caucasian": number, "hispanic": number, "asian": number, "africanAmerican": number, "other": number }
  }`;

  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const jsonText = (response.choices[0]?.message?.content ?? '').trim();
  if (!jsonText) {
    throw new Error('AI returned an empty response for program data.');
  }
  try {
    return JSON.parse(jsonText) as ProgramData;
  } catch (e) {
    console.error('Failed to parse program data JSON:', jsonText);
    throw new Error('The API returned malformed JSON for program data.');
  }
}

export interface SectionAssistanceResult {
  text: string;
  citations: Citation[];
}

/**
 * Get AI assistance for a specific review section
 * Supports two modes:
 * - Empty notes: generates a starter draft from RAG data only
 * - With notes: expands/refines user notes with citations
 */
export async function getSectionAssistance(
  sectionId: string,
  sectionTitle: string,
  sectionDescription: string,
  programData: ProgramData,
  userNotes: string,
  knowledgeBaseData?: string,
  programCategory?: string
): Promise<SectionAssistanceResult> {
  const accjcContext = buildAccjcContext(sectionId);
  const hasNotes = userNotes.trim().length > 0;

  // Retrieve RAG context with numbered citations
  const ragContext = retrieveContext({
    programName: programData.programName,
    programCategory,
    sectionId,
  });
  const { promptText: ragText, citations } = formatRAGContextWithCitations(ragContext);

  const createTailoredPrompt = () => {
    const citationRules = `You MUST cite sources using bracket notation [1], [2] etc. matching the numbered references in the Institutional Context below. Do NOT state any fact that is not supported by the provided data.`;

    let baseIntro: string;
    let modeInstruction: string;

    if (!hasNotes) {
      // Draft-from-scratch mode
      baseIntro = `You are an expert academic program review assistant for College of the Siskiyous. Your task is to generate a starter draft for the '${sectionTitle}' section of a program review for the ${programData.programName} program.

${citationRules}

Generate a starter draft for this section using ONLY the provided institutional data. If no relevant data is available for a topic, state: 'No institutional data available for this area — please add your own observations.' Do not fabricate or assume any facts not present in the provided data.`;
      modeInstruction = `Write 2-3 professional paragraphs that address the section description: "${sectionDescription}"`;
    } else {
      // Expand/refine mode
      baseIntro = `You are an expert academic program review assistant for College of the Siskiyous. Your task is to act as a writing partner to a faculty member.
They have provided notes for the '${sectionTitle}' section of their program review for the ${programData.programName} program.
Your goal is to expand their notes into well-written, professional paragraphs.
Integrate insights from the provided institutional data to support or add context to the user's points.
Do NOT introduce new topics not mentioned in the user's notes. Focus on elaborating what is provided.

${citationRules}`;
      modeInstruction = `User's notes: "${userNotes}"`;
    }

    let specificInstruction = '';
    switch (sectionId) {
      case 'improvement_actions':
        specificInstruction = `Focus on how the described improvement actions are addressing past challenges and how their success could be measured using the available data (e.g., improved completion rates).`;
        break;
      case 'slo_assessment':
        specificInstruction = `Elaborate on progress assessing Student Learning Outcomes. Frame the content in a reflective tone, emphasizing the importance of continuous assessment for program quality.`;
        break;
      case 'budgetary_needs':
        specificInstruction = `Write a clear and concise justification for budgetary needs. If possible, link the requested resources to specific data points (e.g., 'To support the 15% increase in enrollment, additional lab supplies are required.').`;
        break;
      case 'analysis':
      case 'ni_evaluation':
        specificInstruction = `Analyze what is going well and what isn't. Connect points to specific metrics in the program data.`;
        break;
      case 'outcomes_assessment':
        specificInstruction = `Elaborate on assessment activities and evaluation methodologies. Emphasize systematic assessment and continuous improvement cycles.`;
        break;
      default:
        specificInstruction = `Provide a professional, well-structured response that aligns with college program review standards.`;
    }

    return `${baseIntro}

${specificInstruction}

${modeInstruction}

Program Data Summary:
- Enrollment trend: ${programData?.enrollment?.map(e => `${e.year}: ${e.count}`).join(', ')}
- Completion Rate: ${(programData?.completionRate || 0) * 100}%
- Job Placement Rate: ${(programData?.jobPlacementRate || 0) * 100}%
- Program Strengths: ${programData?.summary?.strengths?.join(', ')}
- Program Weaknesses: ${programData?.summary?.weaknesses?.join(', ')}

${knowledgeBaseData ? `\nAdditional Context from Knowledge Base:\n${knowledgeBaseData}` : ''}

${ragText}

${accjcContext}

Generate a well-written, professional response. Reference specific COS policies, historical data, or accreditation findings using [1], [2] bracket citations when relevant.`;
  };

  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: createTailoredPrompt() }],
  });

  return {
    text: response.choices[0]?.message?.content ?? '',
    citations,
  };
}

/**
 * Get ACCJC guidance for a section draft
 * Reviews the user's current draft and provides coaching tips
 * based on applicable ACCJC standards
 */
export async function getSectionGuidance(
  sectionId: string,
  sectionTitle: string,
  sectionContent: string,
  programData: ProgramData,
  programCategory?: string
): Promise<string> {
  // Build rich ACCJC context
  const standards = getMappedStandards(sectionId);
  const standardDetails = standards
    .map(stdId => {
      const std = getStandardById(stdId);
      if (!std) return '';
      const checklist = getComplianceChecklist(stdId);
      const questions = getKeyQuestions(stdId);
      return `### Standard ${std.id}: ${std.title}
${std.description}

Compliance checklist:
${checklist.map(item => `- ${item}`).join('\n')}

Key questions:
${questions.map(q => `- ${q}`).join('\n')}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const prompt = `You are an ACCJC accreditation coach helping a faculty member strengthen their program review for the ${programData.programName} program at College of the Siskiyous.

The user has written the following draft for the "${sectionTitle}" section:

---
${sectionContent}
---

The following ACCJC standards apply to this section:

${standardDetails}

Review this draft and provide constructive guidance. For each ACCJC standard that applies, give 1-2 specific suggestions for how the user could strengthen their response. Frame suggestions as questions or prompts (e.g., "Consider discussing...", "You might strengthen this by...", "Have you addressed...?").

Do NOT rewrite the content — coach the user. Be specific about what's missing or could be improved. If the draft already addresses a standard well, briefly acknowledge that.

Format your response with clear headings for each standard.`;

  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0]?.message?.content ?? '';
}

/**
 * Get chat response for user queries about their program
 */
export async function getChatResponse(
  userMessage: string,
  programData: ProgramData,
  chatHistory: ChatMessage[],
  knowledgeBaseData?: string,
  programCategory?: string
): Promise<string> {
  // Retrieve RAG context for chat
  const ragContext = retrieveContext({
    programName: programData.programName,
    programCategory,
  });
  const ragText = formatRAGContext(ragContext);

  const systemPrompt = `You are a knowledgeable program review assistant for College of the Siskiyous. You have access to program data, institutional policies, and historical context to help faculty members with their program reviews.

Program Context:
- Program: ${programData.programName}
- Enrollment Trend: ${programData.enrollment.map(e => `${e.year}: ${e.count}`).join(', ')}
- Completion Rate: ${(programData.completionRate * 100).toFixed(1)}%
- Job Placement Rate: ${(programData.jobPlacementRate * 100).toFixed(1)}%
- Key Strengths: ${programData.summary.strengths.join(', ')}
- Key Weaknesses: ${programData.summary.weaknesses.join(', ')}

${knowledgeBaseData ? `\nAdditional Program Context:\n${knowledgeBaseData}` : ''}
${ragText}

Provide helpful, specific guidance based on the program data and institutional context. Reference specific COS board policies, historical reviews, or accreditation standards when relevant. Be supportive and constructive.`;

  // Map chat history: our 'model' role → OpenAI 'assistant' role
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map((msg): OpenAI.Chat.ChatCompletionMessageParam => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages,
  });

  return response.choices[0]?.message?.content ?? '';
}

/**
 * Generate an executive summary of the program review
 */
export async function getExecutiveSummary(
  fullReviewText: string,
  historicalData: HistoricalReview[],
  knowledgeBaseData?: string,
  programName?: string,
  programCategory?: string
): Promise<string> {
  // Retrieve RAG context for summary
  const ragContext = retrieveContext({
    programName,
    programCategory,
  });
  const ragText = formatRAGContext(ragContext);

  const historicalContext = historicalData
    .slice(0, 2)
    .map(review => `${review.year} (${review.type}): ${review.title}`)
    .join('\n');

  const prompt = `You are an expert in community college program reviews and accreditation standards for College of the Siskiyous. Create a concise executive summary (300-400 words) of the following program review.

The summary should:
1. Highlight key program strengths and achievements
2. Identify main challenges and areas for improvement
3. Summarize the four-year action plan and strategic priorities
4. Note any resource needs or allocation requests
5. Connect findings to ACCJC accreditation standards where relevant
6. Reference applicable COS board policies and institutional context

Current Program Review:
${fullReviewText}

${historicalContext ? `\nHistorical Context (Previous Reviews):\n${historicalContext}` : ''}

${knowledgeBaseData ? `\nAdditional Context:\n${knowledgeBaseData}` : ''}
${ragText}

Generate a professional, constructive executive summary that references specific institutional context when available.`;

  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0]?.message?.content ?? '';
}
