"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import { ApprovalRuleFormValues } from "@/forms/schemas/approval-rule.schema"

// ==========================================
// 1. FETCH ROLES (For the dropdown)
// ==========================================
export async function fetchRolesForRulesAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "approval_rules")) {
    throw new Error(
      "Forbidden: You do not have permission to view approval rules."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("roles")
    .select("id, role_name")
    .order("role_name")

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 2. FETCH APPROVAL RULES
// ==========================================
export async function fetchApprovalRulesAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "approval_rules")) {
    throw new Error(
      "Forbidden: You do not have permission to view approval rules."
    )
  }

  const supabase = await createClient()
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
  return data
}

// ==========================================
// 3. CREATE APPROVAL RULE
// ==========================================
export async function createApprovalRuleAction(
  values: ApprovalRuleFormValues,
  orgId: number
) {
  const ability = await getServerAbility()
  if (ability.cannot("create", "approval_rules")) {
    throw new Error(
      "Forbidden: You do not have permission to create approval rules."
    )
  }

  const supabase = await createClient()
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
    if (error.code === "23505") {
      // PostgreSQL unique constraint violation
      throw new Error("This step level already exists for this module.")
    }
    throw new Error(error.message)
  }

  return data
}

// ==========================================
// 4. DELETE APPROVAL RULE (Bonus / Necessary for workflows)
// ==========================================
export async function deleteApprovalRuleAction(id: number) {
  const ability = await getServerAbility()
  if (ability.cannot("delete", "approval_rules")) {
    throw new Error(
      "Forbidden: You do not have permission to delete approval rules."
    )
  }

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
