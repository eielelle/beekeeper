import * as z from "zod"

export const positionSchema = z.object({
  title: z.string().min(1, "This field is required").max(100),
  code: z.string().max(20).or(z.literal("")),
})
