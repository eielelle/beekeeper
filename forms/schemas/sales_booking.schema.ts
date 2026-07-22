import * as z from "zod"

export const salesBookingSchema = z.object({
  outlet_id: z.string().min(1, "Please select an outlet."),
  notes: z.string().optional(),
})

export type SalesBookingFormValues = z.infer<typeof salesBookingSchema>
