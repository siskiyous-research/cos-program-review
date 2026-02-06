/**
 * Gemini API Service
 * Backend service for calling Google Gemini AI API
 * IMPORTANT: This is backend-only code. API key is kept secure.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { ProgramData, ChatMessage, HistoricalReview } from './types';
import { buildAccjcContext } from './accjc-standards';

// Initialize Gemini with API key from environment
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set. Check your .env.local file.');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Schema for program data structured output from Gemini
 */
const programDataSchema = {
  type: Type.OBJECT,
  properties: {
    programName: { type: Type.STRING },
    summary: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    enrollment: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          year: { type: Type.INTEGER },
          count: { type: Type.INTEGER },
        },
      },
    },
    completionRate: { type: Type.NUMBER },
    jobPlacementRate: { type: Type.NUMBER },
    demographics: {
      type: Type.OBJECT,
      properties: {
        caucasian: { type: Type.NUMBER },
        hispanic: { type: Type.NUMBER },
        asian: { type: Type.NUMBER },
        africanAmerican: { type: Type.NUMBER },
        other: { type: Type.NUMBER },
      },
    },
  },
};

/**
 * Generate realistic program data using Gemini
 * @param programName - Name of the program
 * @returns ProgramData with enrollment, demographics, and assessment metrics
 */
export async function generateProgramData(programName: string): Promise<ProgramData> {
  const prompt = `Generate realistic, aggregate-level program review data for a community college '${programName}' program. 
  Include metrics like: enrollment numbers for the last 3 years (e.g., 2021, 2022, 2023), completion rates (as a number between 0 and 1), 
  job placement rates for CTE programs (as a number between 0 and 1), student demographics as percentages (summing to 100), 
  and a brief summary of 2-3 program strengths and 2-3 weaknesses. 
  Present this as a JSON object that strictly adheres to the provided schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: programDataSchema,
    },
  });

  const jsonText = response.text.trim();
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
 * @param sectionId - ID of the section
 * @param sectionTitle - Title of the section
 * @param sectionDescription - Description of what goes in the section
 * @param programData - Program data to reference
 * @param userNotes - User's initial notes
 * @param knowledgeBaseData - Additional context/knowledge base
 * @returns AI-generated assistance text
 */
export async function getSectionAssistance(
  sectionId: string,
  sectionTitle: string,
  sectionDescription: string,
  programData: ProgramData,
  userNotes: string,
  knowledgeBaseData?: string
): Promise<string> {
  // Build ACCJC context for this section
  const accjcContext = buildAccjcContext(sectionId);

  // Create tailored prompts based on section type
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

  const prompt = createTailoredPrompt();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
}

/**
 * Get chat response for user queries about their program
 * @param userMessage - User's chat message
 * @param programData - Program data context
 * @param chatHistory - Previous chat messages for context
 * @param knowledgeBaseData - Additional knowledge base context
 * @returns AI response to the user's query
 */
export async function getChatResponse(
  userMessage: string,
  programData: ProgramData,
  chatHistory: ChatMessage[],
  knowledgeBaseData?: string
): Promise<string> {
  // Build chat history for context
  const conversationHistory = chatHistory.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  // Add current message
  conversationHistory.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

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

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      ...conversationHistory,
    ],
  });

  return response.text;
}

/**
 * Generate an executive summary of the program review
 * @param fullReviewText - Complete review text
 * @param historicalData - Previous review data for trend analysis
 * @param knowledgeBaseData - Additional context
 * @returns Executive summary text
 */
export async function getExecutiveSummary(
  fullReviewText: string,
  historicalData: HistoricalReview[],
  knowledgeBaseData?: string
): Promise<string> {
  const historicalContext = historicalData
    .slice(0, 2) // Get last 2 reviews
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

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
}
