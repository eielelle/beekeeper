import * as z from "zod"

export const skuCategorySchema = z.object({
  category_name: z.string().max(80),
  category_description: z.string().min(1).max(120).or(z.literal("")),
})
