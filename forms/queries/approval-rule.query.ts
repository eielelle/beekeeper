import { supabase } from "@/lib/supabase"
import { ApprovalRuleFormValues } from "../schemas/approval-rule.schema"

export type Role = {
  id: number
  role_name: string
}

export type ApprovalRule = {
  id: number
  module: string
  step_level: number
  role: {
    role_name: string
  } | null
}

export async function fetchRoles() {
  const { data, error } = await supabase
    .from("roles")
    .select("id, role_name")
    .order("role_name")

  if (error) throw new Error(error.message)
  return data as Role[]
}

export async function fetchApprovalRules() {
  const { data, error } = await supabase
    .from("approval_rules")
    .select(
      `
      id,
      module,
      step_level,
      role:roles(role_name)
    `
    )
    .order("module", { ascending: true })
    .order("step_level", { ascending: true })

  if (error) throw new Error(error.message)
  return data as unknown as ApprovalRule[]
}

export async function createApprovalRule({
  values,
  orgId,
}: {
  values: ApprovalRuleFormValues
  orgId: number
}) {
  const { data, error } = await supabase
    .from("approval_rules")
    .insert({
      org_id: orgId,
      module: values.module,
      step_level: values.step_level,
      role_id: parseInt(values.role_id),
    })
    .select()
    .single()

  if (error) {
    // Handle unique constraint violations if you added one for (module, step_level)
    if (error.code === "23505") {
      throw new Error("This step level already exists for this module.")
    }
    throw new Error(error.message)
  }

  return data
}
