import * as z from "zod"

export const expenseTypeSchema = z.object({
  type_name: z.string().min(1, "This field is required").max(100),
  type_description: z.string().max(500).or(z.literal("")),
})
