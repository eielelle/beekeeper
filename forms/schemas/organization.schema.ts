import * as z from "zod"

export const organizationSchema = z.object({
  organization_name: z.string().min(1, "This field is required").max(150),
  organization_code: z.string().min(1, "This field is required").max(50),
})
