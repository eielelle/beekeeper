import * as z from "zod"

export const inventoryItemSchema = z.object({
  sku_id: z.coerce
    .number({
      required_error: "SKU is required",
      invalid_type_error: "Please select a valid SKU",
    })
    .min(1, "SKU is required"),
  qty: z.coerce.number().min(0, "Quantity cannot be negative"),
  expiration_date: z.string().or(z.literal("")).nullable(),
})

export const inventoryCartSchema = z.object({
  outlet_id: z.coerce
    .number({
      required_error: "Outlet is required",
      invalid_type_error: "Please select a valid Outlet",
    })
    .min(1, "Outlet is required"),
  items: z
    .array(inventoryItemSchema)
    .min(1, "You must add at least one item to the cart"),
})
