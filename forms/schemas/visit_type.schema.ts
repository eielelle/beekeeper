import * as z from "zod"

export const visitTypeSchema = z.object({
  type_name: z.string().min(1, "Visit type name is required").max(100),
  description: z.string().or(z.literal("")),
})
