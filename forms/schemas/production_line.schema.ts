import * as z from "zod"

export const productionLineSchema = z.object({
  line_name: z.string().min(1, "This field is required").max(100),
  line_description: z.string().max(500).or(z.literal("")),
  line_code: z.string().min(1, "This field is required").max(50),
})
