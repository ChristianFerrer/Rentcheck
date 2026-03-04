import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function createClient() {
  const cookieStore = cookies();

  if (!isSupabaseConfigured()) {
    // Return a no-op client when Supabase is not configured
    return createServerClient("https://placeholder.supabase.co", "placeholder", {
      cookies: { getAll: () => [], setAll: () => {} },
    });
  }

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore.
        }
      },
    },
  });
}

export function createAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return createServerClient("https://placeholder.supabase.co", "placeholder", {
      cookies: { getAll: () => [], setAll: () => {} },
    });
  }

  return createServerClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
