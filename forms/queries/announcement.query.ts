import { supabase } from "@/lib/supabase"
import * as z from "zod"

// 1. Updated Zod Schema
export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(8, "Content cannot be empty"),
  is_superuser_only: z.boolean().default(false),
  send_notification: z.boolean().default(false),
})

export type AnnouncementFormValues = z.infer<typeof announcementSchema>

// 2. Updated Create Function
export async function createAnnouncement(values: AnnouncementFormValues) {
  const { data: authData } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: values.title,
      content: values.content,
      is_superuser_only: values.is_superuser_only,
      send_notification: values.send_notification,
      author_id: authData.user?.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Add this to forms/queries/announcement.query.ts

export async function fetchAnnouncements() {
  const { data, error } = await supabase
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

  if (error) throw new Error(error.message)
  return data
}
