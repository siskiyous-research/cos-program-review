/**
 * POST /api/chat
 * Handles chat messages with program context + RAG
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChatResponse } from '@/lib/gemini-service';
import { ProgramData, ChatMessage } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { message, chatHistory, programData, knowledgeBaseData, programCategory } = await req.json();

    // Validate required fields
    if (!message || !programData) {
      return NextResponse.json({ ok: false, error: 'Missing required fields: message, programData' }, { status: 400 });
    }

    // Call AI service for chat response with RAG context
    const result = await getChatResponse(
      message,
      programData as ProgramData,
      (chatHistory || []) as ChatMessage[],
      knowledgeBaseData,
      programCategory
    );

    return NextResponse.json({ ok: true, response: result.text, citations: result.citations });
  } catch (error) {
    console.error('Error getting chat response:', error);
    const message = error instanceof Error ? error.message : 'Failed to get chat response';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
