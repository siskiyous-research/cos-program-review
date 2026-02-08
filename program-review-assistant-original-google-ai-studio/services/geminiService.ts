import { GoogleGenAI, Type } from "@google/genai";
import { ProgramData, ChatMessage, HistoricalReview } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    console.error("Failed to parse program data JSON:", jsonText);
    throw new Error("The API returned malformed JSON for program data.");
  }
}

export async function getSectionAssistance(
  sectionId: string,
  sectionTitle: string,
  sectionDescription: string,
  programData: ProgramData,
  userNotes: string,
  knowledgeBaseData?: string
): Promise<string> {
  // This function generates a tailored prompt based on the specific section being worked on.
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
        specificInstruction = `The user is analyzing what is going well and what isn't. Expand on their points by connecting them to specific metrics in the program data. For example, if they say 'enrollment is strong', you can add '...as evidenced by a 10% year-over-year increase.'`;
        break;
      case 'vision':
      case 'ni_vision':
        specificInstruction = `Take the user's vision points and articulate them into a compelling forward-looking statement for the program. Connect the vision to the program's identified strengths.`;
        break;
      default:
        specificInstruction = `Carefully read the user's notes and the section description ('${sectionDescription}') and transform the notes into a formal written response that fulfills the requirements of the section.`;
        break;
    }

    return `
      ${baseIntro}
      
      ${specificInstruction}

      ---
      User's Notes to Expand:
      "${userNotes}"
      ---

      Program Data for Context:
      \`\`\`json
      ${JSON.stringify(programData, null, 2)}
      \`\`\`

      Supplementary Knowledge Base Data for Context:
      ---
      ${knowledgeBaseData || 'No additional data provided.'}
      ---
    `;
  };

  const prompt = createTailoredPrompt();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
}


export async function getChatResponse(question: string, programData: ProgramData, chatHistory: ChatMessage[], knowledgeBaseData?: string): Promise<string> {
  const mailtoLink = `[Click here to create a data request ticket](mailto:johntarantino5+b16r0rh6twagg3nhbnkt@boards.trello.com?subject=Program%20Review%20Data%20Request%20for%20${encodeURIComponent(programData.programName)}&body=Hello%20IR%20Office,%0A%0AI%20am%20working%20on%20the%20program%20review%20for%20the%20'${programData.programName}'%20program%20and%20I%20need%20the%20following%20data:%0A%0A[Please%20describe%20your%20data%20request%20here,%20based%20on%20my%20original%20question:%20'${encodeURIComponent(question)}']%0A%0AThank%20you!)`;

  const systemInstruction = `
    You are a helpful chatbot assisting a faculty member with their program review.
    Your knowledge is strictly limited to the provided program data and the supplementary knowledge base data. Do not invent information.
    Answer the user's questions based only on all available data.
    
    If the answer to the user's question cannot be found in the available data, you MUST do the following:
    1. State clearly that the information is not available in the provided dataset.
    2. Offer to help the user create a data request ticket for the Institutional Research (IR) Office.
    3. Provide the special markdown link to create the ticket. The link format MUST BE EXACTLY: ${mailtoLink}
    
    Example scenario:
    User asks: "What are the transfer rates to 4-year universities?"
    Your response should be: "I'm sorry, but information about student transfer rates is not available in the current dataset. You can request this data from the IR Office by creating a ticket. ${mailtoLink}"

    Program Data:
    \`\`\`json
    ${JSON.stringify(programData, null, 2)}
    \`\`\`

    Supplementary Knowledge Base Data:
    ---
    ${knowledgeBaseData || 'No additional data provided.'}
    ---
  `;
  
  const contents = [
    ...chatHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    })),
    { role: 'user', parts: [{ text: question }] }
  ];

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: { systemInstruction: systemInstruction },
    history: chatHistory.map(msg => ({ role: msg.role, parts: [{text: msg.content}] }))
  });

  const response = await chat.sendMessage({ message: question });

  return response.text;
}

export async function getExecutiveSummary(fullReviewText: string, historicalReviews: HistoricalReview[], knowledgeBaseData?: string): Promise<string> {
  // Create a version of the historical data without the blob URLs to save tokens and avoid confusion.
  const reviewsForPrompt = historicalReviews.map(({ url, ...rest }) => rest);

  const prompt = `
    You are an expert in academic administration. Your task is to write a concise, professional executive summary for the provided *current* program review document.
    
    Crucially, you must also analyze the provided historical reviews and supplementary raw data for this program to identify trends, progress, and recurring challenges over time. Your summary should weave this historical context into the analysis of the current review. For example, mention if a current strength continues a positive trend, or if a new action plan addresses a weakness mentioned in previous years.

    Current Program Review Text:
    ---
    ${fullReviewText}
    ---

    Historical Program Reviews (Documents):
    ---
    ${JSON.stringify(reviewsForPrompt, null, 2)}
    ---

    Supplementary Knowledge Base Data (Raw Data/Notes):
    ---
    ${knowledgeBaseData || 'No additional data provided.'}
    ---

    Based on all the provided information, generate an executive summary that is one to two paragraphs long. It should highlight:
    1. The program's key strengths and achievements in the current period.
    2. The most significant challenges or weaknesses currently faced.
    3. The primary goals for the coming years.
    4. How these points relate to past performance, noting any positive trends, persistent issues, or new developments compared to previous years' reviews and data.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro', // Using a more powerful model for deeper analysis
    contents: prompt,
  });

  return response.text;
}

export async function extractTextFromImage(base64Image: string, mimeType: string): Promise<string> {
  const prompt = `Analyze the provided image, which could be a screenshot, chart, or data table. 
  - If the image contains a table, transcribe it into a markdown table format.
  - If it's a chart or graph, describe its main findings and summarize the data presented.
  - If it's primarily text, transcribe the text accurately.
  Focus on extracting and structuring the data from the image.`;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: prompt
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
  });

  return response.text;
}