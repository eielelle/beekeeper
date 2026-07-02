import * as z from "zod"

export const skuUomSchema = z.object({
  uom_name: z.string().max(12),
})
