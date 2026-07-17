import { z } from "zod"

export const productionItemSchema = z.object({
  // Adjusted to match production_items.sku_id
  sku_id: z.string().min(1, "SKU is required"),

  // Adjusted from 'quantity' to 'qty' to match production_items.qty
  qty: z.number().min(1, "Quantity must be at least 1"),

  // Kept as optional. Note: This isn't saved in production_items,
  // but it's useful to keep if your UI needs it for display purposes.
  uom: z.string().optional(),
})

export const productionSchema = z.object({
  // Matches productions.production_date
  production_date: z.string().min(1, "Production date is required"),

  // Adjusted to match productions.production_area_id
  production_area_id: z.string().min(1, "Production area is required"),

  // Adjusted to match productions.production_line_id
  production_line_id: z.string().min(1, "Production line is required"),

  // Matches productions.shift
  shift: z.enum(["day", "night"]),

  // Matches productions.operation_type
  operation_type: z.enum(["startup", "last_prod", "regular"]),

  items: z
    .array(productionItemSchema)
    .min(1, "At least one item must be added"),
})

export type ProductionFormValues = z.infer<typeof productionSchema>
