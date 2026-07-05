import * as z from "zod"

export const outletTypeSchema = z.object({
  type_name: z.string().min(1, "This field is required").max(50),
  type_description: z.string().max(100).or(z.literal("")),
})
