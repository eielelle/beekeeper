import * as z from "zod"

export const skuSchema = z.object({
  sku_code: z.string().min(1, "SKU code is required").max(50),
  item_name: z.string().min(1, "Item name is required").max(150),
  item_description: z.string().max(500).or(z.literal("")),
  barcode: z.string().max(100).or(z.literal("")),
  sku_category_id: z.string().min(1, "SKU Category is required"),
  brand_id: z.string().min(1, "Brand is required"),
  sku_uom_id: z.string().min(1, "Unit of Measure is required"),
})

export type SkuSchemaType = z.infer<typeof skuSchema>
