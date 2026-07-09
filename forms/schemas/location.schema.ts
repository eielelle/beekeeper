import * as z from "zod"

export const locationSchema = z.object({
  name: z.string().min(1, "This field is required").max(100),
  address: z.string().min(1, "This field is required").max(255),
})
