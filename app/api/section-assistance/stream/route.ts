/**
 * POST /api/section-assistance/stream
 * Streams AI assistance for a specific review section
 * First sends citations as a JSON line, then streams text chunks
 */

import { NextRequest } from 'next/server';
import { streamSectionAssistance } from '@/lib/gemini-service';
import { requireAuth } from '@/lib/auth';
import { ProgramData } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { sectionId, sectionTitle, sectionDescription, programData, userNotes, knowledgeBaseData, programCategory, aggregatedData } = await req.json();

    if (!sectionId || !sectionTitle || !programData) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { stream, citations } = await streamSectionAssistance(
      sectionId,
      sectionTitle,
      sectionDescription || '',
      programData as ProgramData,
      userNotes || '',
      knowledgeBaseData,
      programCategory,
      aggregatedData || null
    );

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        // Send citations first as a JSON event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`));

        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error starting section assistance stream:', error);
    const message = error instanceof Error ? error.message : 'Failed to start stream';
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
