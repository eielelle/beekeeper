import * as z from "zod"

export const productionAreaSchema = z.object({
  area_name: z.string().min(1, "This field is required").max(100),
  area_code: z.string().min(1, "This field is required").max(50),
})
