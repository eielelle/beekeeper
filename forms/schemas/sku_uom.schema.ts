import * as z from "zod"

export const skuUomSchema = z.object({
  uom: z.string().min(1, "This field is required").max(20),
})
