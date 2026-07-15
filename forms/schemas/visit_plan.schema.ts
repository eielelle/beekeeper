import * as z from "zod"

export const visitPlanItemSchema = z.object({
  visit_id: z.string().min(1, "A valid visit must be selected"),
})

export const visitPlanSchema = z.object({
  title: z.string().min(1, "Plan title is required").max(150),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  start_time: z.string().or(z.literal("")).nullable(),
  end_time: z.string().or(z.literal("")).nullable(),
  remarks: z.string().or(z.literal("")).nullable(),
  items: z.array(visitPlanItemSchema), // Can be empty if they want to create a draft plan first
})
