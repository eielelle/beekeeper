import { z } from "zod"

export const productionItemSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
})

export const productionSchema = z.object({
  production_date: z.string().min(1, "Production date is required"),
  production_area: z.string().min(1, "Production area is required"),
  production_line: z.string().min(1, "Production line is required"),
  shift: z.enum(["day", "night"]),
  operation_type: z.enum(["startup", "last_prod", "regular"]),
  items: z
    .array(productionItemSchema)
    .min(1, "At least one item must be added"),
})

export type ProductionFormValues = z.infer<typeof productionSchema>
