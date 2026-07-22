import * as z from "zod"

export const badOrderItemSchema = z.object({
  sku_id: z.coerce.number().min(1, "SKU is required"),
  qty: z.coerce.number().min(1, "Quantity must be at least 1"),
  expiration_date: z.string().or(z.literal("")).nullable(),
  reason: z.string().min(1, "Reason is required"),
})

export const badOrderSchema = z.object({
  outlet_id: z.coerce.number().min(1, "Outlet is required"),
  type: z.enum(["for_disposal", "return_to_wh"], {
    required_error: "Type is required",
  }),
  notes: z.string().or(z.literal("")).nullable(),
  items: z
    .array(badOrderItemSchema)
    .min(1, "At least one item is required in the bad order"),
})
