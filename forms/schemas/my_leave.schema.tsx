import * as z from "zod"

export const myLeaveSchema = z.object({
  leave_date: z.string().min(1, "Leave date is required"),
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(500, "Reason is too long"),
})
