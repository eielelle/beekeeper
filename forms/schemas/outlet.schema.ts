import * as z from "zod"

export const outletSchema = z.object({
  outlet_code: z.string().min(1, "This field is required").max(50),
  outlet_name: z.string().min(1, "This field is required").max(100),
  outlet_description: z.string().max(200).or(z.literal("")),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Invalid phone number")
    .or(z.literal("")),
  email: z.string().email().or(z.literal("")),
  is_approved: z.boolean(),
  is_distributor: z.boolean(),
  distributor_id: z.string().or(z.literal("")),
  sales_group_id: z.string().or(z.literal("")),
  address: z.string().max(1000).or(z.literal("")),
  region: z.string().max(100).or(z.literal("")),
  city: z.string().max(100).or(z.literal("")),
  province: z.string().max(100).or(z.literal("")),
  barangay: z.string().max(100).or(z.literal("")),
  country: z.string().max(100).or(z.literal("")),
  zip_code: z.string().or(z.literal("")),
  outlet_type_id: z.string().or(z.literal("")),
})
