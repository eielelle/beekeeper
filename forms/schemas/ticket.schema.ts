import * as z from "zod"

export const ticketSchema = z.object({
  name: z.string().min(1, "This field is required").max(100),
  description: z.string().min(1, "This field is required").max(500),
})
