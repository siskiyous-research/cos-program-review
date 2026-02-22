/**
 * OpenRouter API Service
 * Backend service for calling Xiaomi MiMo-V2-Flash via OpenRouter
 * IMPORTANT: This is backend-only code. API key is kept secure.
 */

import OpenAI from 'openai';
import { ProgramData, ChatMessage, HistoricalReview } from './types';
import { buildAccjcContext } from './accjc-standards';

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

/**
 * Get AI assistance for a specific review section
 * ACCJC Integration: Includes relevant standards in the prompt
 */
export async function getSectionAssistance(
  sectionId: string,
  sectionTitle: string,
  sectionDescription: string,
  programData: ProgramData,
  userNotes: string,
  knowledgeBaseData?: string
): Promise<string> {
  const accjcContext = buildAccjcContext(sectionId);

  const createTailoredPrompt = () => {
    const baseIntro = `You are an expert academic program review assistant for a community college. Your task is to act as a writing partner to a faculty member.
They have provided notes for the '${sectionTitle}' section of their program review.
Your goal is to expand their notes into a well-written, professional paragraph or two.
Integrate insights from the provided Program Data and Knowledge Base to support or add context to the user's points.
Do NOT introduce new topics not mentioned in the user's notes. Focus on elaborating what is provided.`;

    let specificInstruction = '';
    switch (sectionId) {
      case 'improvement_actions':
        specificInstruction = `Focus on how the described improvement actions are addressing past challenges and how their success could be measured using the available data (e.g., improved completion rates).`;
        break;
      case 'slo_assessment':
        specificInstruction = `Elaborate on the user's description of progress on assessing Student Learning Outcomes. Frame the notes in a reflective tone, emphasizing the importance of continuous assessment for program quality.`;
        break;
      case 'budgetary_needs':
        specificInstruction = `Turn the user's notes into a clear and concise justification for budgetary needs. If possible, link the requested resources to specific data points (e.g., 'To support the 15% increase in enrollment, additional lab supplies are required.').`;
        break;
      case 'analysis':
      case 'ni_evaluation':
        specificInstruction = `The user is analyzing what is going well and what isn't. Expand on their points by connecting them to specific metrics in the program data. For example, if they say 'enrollment is strong', you can add '...as evidenced by a ${Math.round(((programData?.enrollment?.[programData.enrollment.length - 1]?.count || 0) - (programData?.enrollment?.[0]?.count || 1)) / (programData?.enrollment?.[0]?.count || 1) * 100)}% increase.'`;
        break;
      case 'outcomes_assessment':
        specificInstruction = `Elaborate on assessment activities and evaluation methodologies. Emphasize the importance of systematic assessment and continuous improvement cycles.`;
        break;
      default:
        specificInstruction = `Provide a professional, well-structured expansion of the user's notes that aligns with college program review standards.`;
    }

    return `${baseIntro}

${specificInstruction}

User's notes: "${userNotes}"

Program Data Summary:
- Enrollment trend: ${programData?.enrollment?.map(e => `${e.year}: ${e.count}`).join(', ')}
- Completion Rate: ${(programData?.completionRate || 0) * 100}%
- Job Placement Rate: ${(programData?.jobPlacementRate || 0) * 100}%
- Program Strengths: ${programData?.summary?.strengths?.join(', ')}
- Program Weaknesses: ${programData?.summary?.weaknesses?.join(', ')}

${knowledgeBaseData ? `\nAdditional Context from Knowledge Base:\n${knowledgeBaseData}` : ''}

${accjcContext}

Generate a well-written, professional response that expands on the user's notes without introducing new topics.`;
  };

  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: createTailoredPrompt() }],
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
  knowledgeBaseData?: string
): Promise<string> {
  const systemPrompt = `You are a knowledgeable program review assistant for a community college. You have access to program data and are helping faculty members with their program reviews.

Program Context:
- Program: ${programData.programName}
- Enrollment Trend: ${programData.enrollment.map(e => `${e.year}: ${e.count}`).join(', ')}
- Completion Rate: ${(programData.completionRate * 100).toFixed(1)}%
- Job Placement Rate: ${(programData.jobPlacementRate * 100).toFixed(1)}%
- Key Strengths: ${programData.summary.strengths.join(', ')}
- Key Weaknesses: ${programData.summary.weaknesses.join(', ')}

${knowledgeBaseData ? `\nAdditional Program Context:\n${knowledgeBaseData}` : ''}

Provide helpful, specific guidance based on the program data and the user's questions. Be supportive and constructive.`;

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
  knowledgeBaseData?: string
): Promise<string> {
  const historicalContext = historicalData
    .slice(0, 2)
    .map(review => `${review.year} (${review.type}): ${review.title}`)
    .join('\n');

  const prompt = `You are an expert in community college program reviews and accreditation standards. Create a concise executive summary (300-400 words) of the following program review.

The summary should:
1. Highlight key program strengths and achievements
2. Identify main challenges and areas for improvement
3. Summarize the four-year action plan and strategic priorities
4. Note any resource needs or allocation requests
5. Connect findings to ACCJC accreditation standards where relevant

Current Program Review:
${fullReviewText}

${historicalContext ? `\nHistorical Context (Previous Reviews):\n${historicalContext}` : ''}

${knowledgeBaseData ? `\nAdditional Context:\n${knowledgeBaseData}` : ''}

Generate a professional, constructive executive summary.`;

  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0]?.message?.content ?? '';
}
