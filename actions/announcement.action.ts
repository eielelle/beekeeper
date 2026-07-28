"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility, fetchUserPermissions } from "@/lib/casl/server"
import { AnnouncementFormValues } from "@/forms/queries/announcement.query"

// ==========================================
// 1. FETCH ANNOUNCEMENTS (With secure filtering)
// ==========================================
export async function fetchAnnouncementsAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "announcements")) {
    throw new Error(
      "Forbidden: You do not have permission to view announcements."
    )
  }

  // Get the user's superuser status securely from the server
  const { isSuperuser } = await fetchUserPermissions()
  const supabase = await createClient()

  let query = supabase
    .from("announcements")
    .select(
      `
      id,
      title,
      content,
      is_superuser_only,
      send_notification,
      created_at,
      author_id,
      author:employees!user_id (
        first_name,
        last_name,
        avatar_url
      )
    `
    )
    .order("created_at", { ascending: false })

  // SECURITY: If they aren't a superuser, filter out superuser-only announcements
  if (!isSuperuser) {
    query = query.eq("is_superuser_only", false)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return data
}

// ==========================================
// 2. CREATE ANNOUNCEMENT
// ==========================================
export async function createAnnouncementAction(values: AnnouncementFormValues) {
  const ability = await getServerAbility()
  if (ability.cannot("create", "announcements")) {
    throw new Error(
      "Forbidden: You do not have permission to create announcements."
    )
  }

  const { userId } = await fetchUserPermissions()
  if (!userId) throw new Error("Unauthorized: Could not identify user context.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: values.title,
      content: values.content,
      is_superuser_only: values.is_superuser_only,
      send_notification: values.send_notification,
      author_id: userId, // Securely mapped on the server, cannot be spoofed!
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. DELETE ANNOUNCEMENT (Added for future-proofing)
// ==========================================
export async function deleteAnnouncementAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("delete", "announcements")) {
    throw new Error(
      "Forbidden: You do not have permission to delete announcements."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
