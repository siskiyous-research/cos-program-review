/**
 * POST /api/chat
 * Handles chat messages with program context
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChatResponse } from '@/lib/gemini-service';
import { ProgramData, ChatMessage } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { message, chatHistory, programData, knowledgeBaseData } = await req.json();

    // Validate required fields
    if (!message || !programData) {
      return NextResponse.json({ ok: false, error: 'Missing required fields: message, programData' }, { status: 400 });
    }

    // Call Gemini service for chat response
    const response = await getChatResponse(message, programData as ProgramData, (chatHistory || []) as ChatMessage[], knowledgeBaseData);

    return NextResponse.json({ ok: true, response });
  } catch (error) {
    console.error('Error getting chat response:', error);
    const message = error instanceof Error ? error.message : 'Failed to get chat response';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
