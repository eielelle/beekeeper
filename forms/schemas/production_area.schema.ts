import * as z from "zod"

export const productionAreaSchema = z.object({
  area_code: z.string().min(1, "This field is required").max(50),
  area_name: z.string().min(1, "This field is required").max(100),
  area_description: z.string().max(500).or(z.literal("")),
})
