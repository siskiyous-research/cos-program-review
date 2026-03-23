import { createAdminClient } from "@/lib/supabase/admin";

const cache = new Map<string, { value: string; expiry: number }>();
const CACHE_TTL = 60_000; // 60 seconds

const ENV_FALLBACKS: Record<string, string | undefined> = {
  openrouter_api_key: process.env.OPENROUTER_API_KEY,
  ai_mode: process.env.AI_MODE || "local",
  local_ai_url: process.env.LOCAL_AI_URL,
  local_ai_model: process.env.LOCAL_AI_MODEL,
  zogotech_db_password: process.env.ZOGOTECH_DB_PASSWORD,
  zogotech_db_server: process.env.ZOGOTECH_DB_SERVER || "zogotech.siskiyous.edu",
  zogotech_db_user: process.env.ZOGOTECH_DB_USER || "jtarantino",
};

export async function getSetting(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.value;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("pr_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (!error && data?.value) {
      cache.set(key, { value: data.value, expiry: Date.now() + CACHE_TTL });
      return data.value;
    }
  } catch (err) {
    console.warn(`[getSetting] Failed to get ${key} from database:`, err);
    // DB not available, fall through to env var
  }

  const envValue = ENV_FALLBACKS[key];
  if (envValue) {
    cache.set(key, { value: envValue, expiry: Date.now() + CACHE_TTL });
    return envValue;
  }

  return null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("pr_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) {
    throw new Error(`Failed to save setting: ${error.message}`);
  }

  cache.set(key, { value, expiry: Date.now() + CACHE_TTL });
}

export function clearSettingsCache() {
  cache.clear();
}
