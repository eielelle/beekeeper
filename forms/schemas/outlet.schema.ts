import * as z from "zod"

export const outletSchema = z.object({
  outlet_code: z.string().min(1, "Outlet code is required").max(50),
  outlet_name: z.string().min(1, "Outlet name is required").max(150),
  sales_group_id: z.coerce.number().or(z.literal(undefined)),
  address: z.string().or(z.literal("")),
  region: z.string().or(z.literal("")),
  province: z.string().or(z.literal("")),
  city: z.string().or(z.literal("")),
  barangay: z.string().or(z.literal("")),
  distributor_id: z.coerce.number().or(z.literal(undefined)),
  is_distributor: z.boolean(),
  is_active: z.boolean(),
  lat: z.number(),
  long: z.number(),
  geofence_radius: z.number(),
})
