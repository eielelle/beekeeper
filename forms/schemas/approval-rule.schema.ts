import * as z from "zod"

export const approvalRuleSchema = z.object({
  module: z.string().min(1, "Please select a module."),
  step_level: z.coerce.number().min(1, "Step level must be at least 1."),
  role_id: z.string().min(1, "Please select an approver role."),
})

export type ApprovalRuleFormValues = z.infer<typeof approvalRuleSchema>
