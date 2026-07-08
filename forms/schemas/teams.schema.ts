import * as z from "zod"

export const teamSchema = z.object({
  team_name: z.string().min(1, "This field is required"),
  team_description: z.string().or(z.literal("")),
  approver_user_id: z.string().or(z.literal("")),
})
