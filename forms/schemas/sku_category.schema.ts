import * as z from "zod"

export const skuCategorySchema = z.object({
  category_name: z.string().min(1, "This field is required").max(100),
  category_description: z.string().max(500).or(z.literal("")),
})
