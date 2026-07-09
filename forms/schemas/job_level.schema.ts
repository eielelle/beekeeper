import * as z from "zod"

export const jobLevelSchema = z.object({
  level_name: z.string().min(1, "This field is required").max(100),
  rank: z.coerce
    .number({ invalid_type_error: "Rank must be a valid number" })
    .min(1, "Rank must be at least 1"),
})
