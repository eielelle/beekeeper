"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import { triggerApprovalWorkflow } from "./approval.action"
import { subject } from "@casl/ability" // 1. Import subject helper

type EmployeeRecord = {
  id: number
  org_id: number | null
}

async function getCurrentEmployee(): Promise<EmployeeRecord> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized: No session found.")

  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, org_id")
    .eq("user_id", user.id)
    .single()

  if (error || !employee) throw new Error("Employee record not found.")
  return employee
}

export async function createLeaveAction(reason: string, leaveDate: string) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "leaves")) {
    throw new Error(
      "Forbidden: You do not have permission to file leave requests."
    )
  }

  const employee = await getCurrentEmployee()
  const supabase = await createClient()

  const { data: leave, error } = await supabase
    .from("leaves")
    .insert([
      {
        employee_id: employee.id,
        reason,
        leave_date: leaveDate,
        status: "pending",
      },
    ])
    .select("id")
    .single()

  if (error) throw new Error(`Failed to create leave: ${error.message}`)

  await triggerApprovalWorkflow(
    "leaves",
    leave.id.toString(),
    employee.id,
    employee.org_id ?? undefined
  )

  return leave
}

export async function fetchMyLeavesAction() {
  const ability = await getServerAbility()
  const employee = await getCurrentEmployee()

  if (ability.cannot("read", "leaves")) {
    throw new Error("Forbidden: You cannot view leaves.")
  }

  const supabase = await createClient()
  let query = supabase
    .from("leaves")
    .select("*")
    .order("created_at", { ascending: false })

  // 2. Use subject("leaves", { employee_id: ... }) instead of 3 arguments
  if (
    ability.cannot("read", subject("leaves", { employee_id: employee.id + 1 }))
  ) {
    query = query.eq("employee_id", employee.id)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return data
}
