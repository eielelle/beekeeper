import * as z from "zod"

export const skuUomSchema = z.object({
  uom_code: z.string().min(1, "This field is required").max(20),
  uom_name: z.string().min(1, "This field is required").max(100),
})
