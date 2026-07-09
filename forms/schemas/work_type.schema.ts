import * as z from "zod"

export const workTypeSchema = z.object({
  name: z.string().min(1, "This field is required").max(100),
})
