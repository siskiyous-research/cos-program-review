/**
 * POST /api/section-guidance/stream
 * Streams ACCJC guidance for a section draft
 */

import { NextRequest } from 'next/server';
import { streamSectionGuidance } from '@/lib/gemini-service';
import { requireAuth } from '@/lib/auth';
import { ProgramData } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { sectionId, sectionTitle, sectionContent, programData, programCategory } = await req.json();

    if (!sectionId || !sectionTitle || !sectionContent || !programData) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Strip HTML tags for length check
    const plainText = sectionContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const hasImages = /<img\s/i.test(sectionContent);

    if (plainText.length < 50 && !hasImages) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        start(controller) {
          const msg = 'This section is empty or has very little content. ACCJC guidance requires substantive written content to evaluate. Please draft your response first, then request guidance to strengthen it.';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: msg })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        },
      });
      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      });
    }

    const stream = await streamSectionGuidance(
      sectionId,
      sectionTitle,
      sectionContent,
      programData as ProgramData,
      programCategory
    );

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        } catch (err) {
          console.error('Guidance stream error:', err);
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
    console.error('Error starting guidance stream:', error);
    const message = error instanceof Error ? error.message : 'Failed to start stream';
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
