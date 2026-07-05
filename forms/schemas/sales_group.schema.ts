import * as z from "zod"

export const salesGroupSchema = z.object({
  group_name: z.string().min(1, "This field is required").max(50),
  group_description: z.string().max(100).or(z.literal("")),
})
