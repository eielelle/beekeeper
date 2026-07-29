"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import { ApprovalRuleFormValues } from "@/forms/schemas/approval-rule.schema"

export async function fetchRolesForRulesAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "approval_rules")) throw new Error("Forbidden")
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("roles")
    .select("id, role_name")
    .order("role_name")
  if (error) throw new Error(error.message)
  return data
}

// NEW: Fetch Departments for the dropdown
export async function fetchDepartmentsForRulesAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "approval_rules")) throw new Error("Forbidden")
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, code")
    .order("name")
  if (error) throw new Error(error.message)
  return data
}

export async function fetchApprovalRulesAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "approval_rules")) throw new Error("Forbidden")
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("approval_rules")
    .select(
      `
      id,
      module,
      step_level,
      is_department_head,
      role:roles(role_name),
      department:departments(name, code)
    `
    )
    .order("module", { ascending: true })
    .order("step_level", { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function createApprovalRuleAction(
  values: ApprovalRuleFormValues,
  orgId: number
) {
  const ability = await getServerAbility()
  if (ability.cannot("create", "approval_rules")) throw new Error("Forbidden")

  // Map the routing_mode to the correct database columns
  const isDeptHead = values.routing_mode === "requester_dept"
  const roleId =
    values.routing_mode === "role" && values.role_id
      ? parseInt(values.role_id)
      : null
  const deptId =
    values.routing_mode === "specific_dept" && values.department_id
      ? parseInt(values.department_id)
      : null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("approval_rules")
    .insert({
      org_id: orgId,
      module: values.module,
      step_level: values.step_level,
      is_department_head: isDeptHead,
      role_id: roleId,
      department_id: deptId,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505")
      throw new Error("This step level already exists for this module.")
    throw new Error(error.message)
  }
  return data
}

export async function deleteApprovalRuleAction(id: number) {
  const ability = await getServerAbility()
  if (ability.cannot("delete", "approval_rules")) throw new Error("Forbidden")
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("approval_rules")
    .delete()
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(`Delete failed: ${error.message}`)
  return data
}
