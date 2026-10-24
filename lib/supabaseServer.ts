import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createClient(accessToken?: string) {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {},
      },
    }
  );

  // If access token is provided, set it in the session
  if (accessToken) {
    try {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // Not needed for server-side operations
      });
    } catch (error) {
      // If setSession fails, the token in headers should still work
      console.error('Failed to set session:', error);
    }
  }

  return supabase;
}
