import * as z from "zod"

export const branchSchema = z.object({
  name: z.string().min(1, "This field is required").max(100),
  code: z.string().min(1, "This field is required").max(20),
})
