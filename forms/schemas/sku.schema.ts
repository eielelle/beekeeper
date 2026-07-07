import * as z from "zod"

export const skuSchema = z.object({
  sku_category_id: z.coerce.string().min(1, "Category is required"),
  sku_uom_id: z.coerce.string().min(1, "UOM is required"),
  item_name: z.string().min(1, "This field is required").max(100),
  item_description: z.string().max(500).or(z.literal("")),
  sku_code: z.coerce.string().min(1, "This field is required").max(50),
  barcode: z.string().max(50).or(z.literal("")),
})
