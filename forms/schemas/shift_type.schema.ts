import * as z from "zod"

export const shiftTypeSchema = z.object({
  name: z.string().min(1, "This field is required").max(100),
  start_time: z.string().min(1, "This field is required"),
  end_time: z.string().min(1, "This field is required"),
})
