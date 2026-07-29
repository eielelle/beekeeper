import { toast } from "sonner"
import { ApprovalRuleFormValues } from "../schemas/approval-rule.schema"
import {
  fetchRolesForRulesAction,
  fetchApprovalRulesAction,
  createApprovalRuleAction,
  deleteApprovalRuleAction,
  fetchDepartmentsForRulesAction,
} from "@/actions/approval-rule.action"

export type Role = {
  id: number
  role_name: string
}

export type ApprovalRule = {
  id: number
  module: string
  step_level: number
  is_department_head: boolean
  role: {
    role_name: string
  } | null
  department: { name: string; code: string } | null
}

export async function fetchRoles() {
  try {
    const data = await fetchRolesForRulesAction()
    return data as Role[]
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch roles"
    toast.error(`ERR: ${message}`)
    return []
  }
}

export async function fetchApprovalRules() {
  try {
    const data = await fetchApprovalRulesAction()
    return data as unknown as ApprovalRule[]
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch rules"
    toast.error(`ERR: ${message}`)
    return []
  }
}

export async function createApprovalRule({
  values,
  orgId,
}: {
  values: ApprovalRuleFormValues
  orgId: number
}) {
  const t = toast.loading("Saving workflow rule...")
  try {
    const data = await createApprovalRuleAction(values, orgId)
    toast.dismiss(t)
    toast.success("Approval rule successfully added.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteApprovalRule(id: number) {
  const t = toast.loading("Deleting workflow rule...")
  try {
    const data = await deleteApprovalRuleAction(id)
    toast.dismiss(t)
    toast.success("Approval rule deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function fetchDepartmentsForRule() {
  try {
    return await fetchDepartmentsForRulesAction()
  } catch (error: any) {
    return []
  }
}
