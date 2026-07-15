import * as z from "zod"

export const visitSchema = z.object({
  outlet_id: z.coerce
    .number({
      required_error: "Outlet is required",
      invalid_type_error: "Please select an Outlet",
    })
    .min(1, "Outlet is required"),
  visit_type_id: z.coerce
    .number({
      required_error: "Visit type is required",
      invalid_type_error: "Please select a Visit Type",
    })
    .min(1, "Visit type is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  start_time: z.string().or(z.literal("")).nullable(),
  end_time: z.string().or(z.literal("")).nullable(),
  notes: z.string().or(z.literal("")).nullable(),
  repeats_every: z.string().or(z.literal("")).nullable(),
  repeat_on: z.array(z.string()).nullable(),
})
