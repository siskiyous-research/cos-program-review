import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type AuthResult =
  | { user: { id: string; email?: string }; error: null }
  | { user: null; error: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user: { id: user.id, email: user.email ?? undefined }, error: null };
}
