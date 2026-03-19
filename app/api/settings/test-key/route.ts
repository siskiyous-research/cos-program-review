import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { mode, apiKey, localUrl, localModel } = await request.json();

    if (mode === "local") {
      if (!localUrl || !localModel) {
        return NextResponse.json(
          { valid: false, error: "Local URL and model are required" },
          { status: 400 }
        );
      }

      const res = await fetch(`${localUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: localModel,
          messages: [{ role: "user", content: "Say hello" }],
          max_tokens: 10,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return NextResponse.json(
          { valid: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` },
          { status: 200 }
        );
      }

      return NextResponse.json({ valid: true });
    } else {
      // Cloud mode — test OpenRouter key
      if (!apiKey) {
        return NextResponse.json(
          { valid: false, error: "API key is required" },
          { status: 400 }
        );
      }

      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        return NextResponse.json(
          { valid: false, error: `HTTP ${res.status}: Invalid API key` },
          { status: 200 }
        );
      }

      return NextResponse.json({ valid: true });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ valid: false, error: msg }, { status: 200 });
  }
}
