import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Use the standard client without SSR cookie parsing
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase admin environment variables.")
}

export const supabaseAdmin = createSupabaseClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
