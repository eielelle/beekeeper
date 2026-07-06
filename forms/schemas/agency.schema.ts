import * as z from "zod"

export const agencySchema = z.object({
  agency_name: z.string().min(1, "Agency name is required").max(150),
  agency_description: z.string().max(500).or(z.literal("")),
  organization_id: z.string().optional(),
})
