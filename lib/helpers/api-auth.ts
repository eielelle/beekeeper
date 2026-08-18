// lib/api-auth.ts
import { headers } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function getApiAuth() {
  const headersList = await headers()
  const authHeader = headersList.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { supabase: null, user: null, error: "No Bearer token provided" }
  }

  const accessToken = authHeader.substring(7)

  // Initialize client using private, server-only environment variables
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken)

  if (authError || !user) {
    return {
      supabase: null,
      user: null,
      error: authError?.message || "Invalid token",
    }
  }

  return { supabase, user, error: null }
}
