import * as z from "zod"

export const skuSchema = z.object({
  sku_category: z.string().max(12),
  sku_uom: z.string().max(12),
  item_name: z.string().max(80),
  item_description: z.string().max(160),
  sku_code: z.string().max(40),
  barcode: z.string().max(80),
})
