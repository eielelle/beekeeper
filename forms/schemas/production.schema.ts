import * as z from "zod"

export const productionFormSchema = z.object({
  production_date: z.string().min(1, "Production date is required"),
  production_area_id: z.coerce.string().min(1, "Production area is required"),
  production_line_id: z.coerce.string().min(1, "Production line is required"),
  is_day: z.boolean({ required_error: "Shift selection is required" }),
  operation_type: z.string().min(1, "Operation type is required"),
  // Moving the quantity validation inside the nested array objects
  items: z
    .array(
      z.object({
        sku_id: z.coerce.string().min(1, "Please select an item"),
        qty: z.coerce.number().positive("Quantity must be greater than 0"),
      })
    )
    .min(1, "You must add at least one SKU to your production entry")
    .refine(
      (items) => {
        const activeIds = items.map((i) => i.sku_id).filter(Boolean)
        return activeIds.length === new Set(activeIds).size
      },
      {
        message:
          "Duplicate SKUs discovered. Each item in the cart must be unique.",
        path: [0],
      }
    ),
})
