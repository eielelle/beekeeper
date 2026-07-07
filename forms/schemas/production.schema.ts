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
        qty: z
          .string()
          .refine((val) => Number(val) > 0, {
            message: "Quantity must be greater than 0",
          }),
      })
    )
    .min(1, "You must add at least one SKU to your production entry")
    .superRefine((items, ctx) => {
      const seen = new Map<string, number>()

      items.forEach((item, index) => {
        if (!item.sku_id) return

        const previous = seen.get(item.sku_id)

        if (previous !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Duplicate SKU selected.",
            path: [previous, "sku_id"],
          })

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Duplicate SKU selected.",
            path: [index, "sku_id"],
          })
        } else {
          seen.set(item.sku_id, index)
        }
      })
    }),
})
