import * as z from "zod"

export const approvalRuleSchema = z
  .object({
    module: z.string().min(1, "Module is required"),
    step_level: z.number().min(1, "Step level must be at least 1"),
    routing_mode: z.enum(["role", "requester_dept", "specific_dept"]),
    role_id: z.string().optional(),
    department_id: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.routing_mode === "role" && !data.role_id) return false
      if (data.routing_mode === "specific_dept" && !data.department_id)
        return false
      return true
    },
    {
      message: "Please select the required role or department.",
      path: ["routing_mode"],
    }
  )

export type ApprovalRuleFormValues = z.infer<typeof approvalRuleSchema>
