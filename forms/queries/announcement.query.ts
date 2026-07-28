import * as z from "zod"
import { toast } from "sonner"
import {
  fetchAnnouncementsAction,
  createAnnouncementAction,
  deleteAnnouncementAction,
} from "@/actions/announcement.action"

// 1. Zod Schema
export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(8, "Content cannot be empty"),
  is_superuser_only: z.boolean().default(false),
  send_notification: z.boolean().default(false),
})

export type AnnouncementFormValues = z.infer<typeof announcementSchema>

// 2. Fetch Query
export async function fetchAnnouncements() {
  try {
    return await fetchAnnouncementsAction()
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

// 3. Create Mutation
export async function createAnnouncement(values: AnnouncementFormValues) {
  const t = toast.loading("Publishing announcement...")
  try {
    const data = await createAnnouncementAction(values)
    toast.dismiss(t)
    toast.success("Announcement successfully published.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

// 4. Delete Mutation (Bonus)
export async function deleteAnnouncement(id: string) {
  const t = toast.loading("Deleting announcement...")
  try {
    const data = await deleteAnnouncementAction(id)
    toast.dismiss(t)
    toast.success("Announcement successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
