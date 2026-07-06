import * as z from "zod"

export const organizationSchema = z.object({
  organization_name: z
    .string()
    .min(1, "Organization name is required")
    .max(120),
})
