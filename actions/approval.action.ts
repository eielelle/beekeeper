"use server"

import { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getServerAbility } from "@/lib/casl/server"

async function getCurrentEmployee(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("id, role_id, org_id")
    .eq("user_id", userId)
    .single()

  if (error || !data) throw new Error("Employee profile not found.")
  return data
}

// ==========================================
// 1. TRIGGER WORKFLOW
// ==========================================
export async function triggerApprovalWorkflow(
  moduleName: string,
  recordId: string,
  requesterId: number,
  orgId?: number
) {
  const supabase = await createClient()

  let query = supabase
    .from("approval_rules")
    .select("id")
    .eq("module", moduleName)
  if (orgId) query = query.eq("org_id", orgId)

  const { data: rules } = await query.order("step_level", { ascending: true })

  if (!rules || rules.length === 0) return null

  const { data: request, error } = await supabaseAdmin
    .from("approval_requests")
    .insert([
      {
        module: moduleName,
        record_id: recordId,
        requester_id: requesterId,
        org_id: orgId || null,
        status: "pending",
        current_step: 1,
      },
    ])
    .select()
    .single()

  if (error) throw new Error(`Failed to trigger workflow: ${error.message}`)
  return request
}

// ==========================================
// 2. FETCH PENDING APPROVALS
// ==========================================
export async function fetchMyPendingApprovalsAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "approval_requests")) {
    throw new Error("Forbidden: You do not have permission to view approvals.")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const employee = await getCurrentEmployee(supabase, user.id)
  if (!employee) return []

  const { data: allPending } = await supabaseAdmin
    .from("approval_requests")
    .select(
      `
      id,
      module,
      record_id,
      status,
      current_step,
      created_at,
      requester_id,
      requester:employees!requester_id(id, first_name, last_name, avatar_url)
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (!allPending || allPending.length === 0) return []

  const { data: allRules } = await supabaseAdmin
    .from("approval_rules")
    .select("*")

  const { data: myDepartments } = await supabaseAdmin
    .from("departments")
    .select("id")
    .eq("department_head_id", employee.id)

  let myEmployeeIds: number[] = []

  if (myDepartments && myDepartments.length > 0) {
    const deptIds = myDepartments.map((d) => Number(d.id))
    const { data: deptEmployees } = await supabaseAdmin
      .from("employee_work_information")
      .select("employee_id")
      .in("department_id", deptIds)

    myEmployeeIds = deptEmployees?.map((e) => Number(e.employee_id)) || []
  }

  const myApprovals = allPending.filter((request) => {
    // Check ALL matching rules to prevent short-circuiting on duplicate/test rules
    const matchingRules =
      allRules?.filter(
        (r) =>
          r.module === request.module &&
          Number(r.step_level) === Number(request.current_step)
      ) || []

    let isMatch = false

    for (const rule of matchingRules) {
      if (rule.is_department_head === true) {
        if (myEmployeeIds.includes(Number(request.requester_id))) isMatch = true
      }
      if (rule.department_id) {
        if (
          myDepartments?.some(
            (d) => Number(d.id) === Number(rule.department_id)
          )
        )
          isMatch = true
      }
      if (rule.role_id && employee.role_id) {
        if (Number(rule.role_id) === Number(employee.role_id)) isMatch = true
      }
      if (rule.employee_id) {
        if (Number(rule.employee_id) === Number(employee.id)) isMatch = true
      }
    }

    return isMatch
  })

  return myApprovals
}

// ==========================================
// 3. PROCESS APPROVAL/REJECTION
// ==========================================
export async function processApprovalAction(
  requestId: string,
  action: "approved" | "rejected",
  remarks?: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const employee = await getCurrentEmployee(supabase, user.id)

  const { data: request } = await supabaseAdmin
    .from("approval_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  if (!request || request.status !== "pending") {
    throw new Error(
      "This request has already been processed or does not exist."
    )
  }

  // 🚀 FIX: Fetch ALL rules for this step instead of .single() to avoid crashes
  const { data: rules } = await supabaseAdmin
    .from("approval_rules")
    .select("*")
    .eq("module", request.module)
    .eq("step_level", request.current_step)

  if (!rules || rules.length === 0)
    throw new Error("No rule configured for this step.")

  let isAuthorized = false

  for (const rule of rules) {
    if (rule.is_department_head === true) {
      const { data: requesterInfo } = await supabaseAdmin
        .from("employee_work_information")
        .select("department_id")
        .eq("employee_id", request.requester_id)
        .single()

      if (requesterInfo?.department_id) {
        const { data: dept } = await supabaseAdmin
          .from("departments")
          .select("department_head_id")
          .eq("id", requesterInfo.department_id)
          .single()

        if (Number(dept?.department_head_id) === Number(employee.id)) {
          isAuthorized = true
          break // Authorized, stop checking
        }
      }
    }

    if (rule.department_id) {
      const { data: dept } = await supabaseAdmin
        .from("departments")
        .select("department_head_id")
        .eq("id", rule.department_id)
        .single()

      if (Number(dept?.department_head_id) === Number(employee.id)) {
        isAuthorized = true
        break
      }
    }

    if (rule.role_id && employee.role_id) {
      if (Number(rule.role_id) === Number(employee.role_id)) {
        isAuthorized = true
        break
      }
    }

    if (rule.employee_id) {
      if (Number(rule.employee_id) === Number(employee.id)) {
        isAuthorized = true
        break
      }
    }
  }

  if (!isAuthorized) {
    throw new Error(
      "Forbidden: You are not the designated approver for this workflow step."
    )
  }

  // 5. Log the manager's action securely
  await supabaseAdmin.from("approval_logs").insert([
    {
      request_id: requestId,
      step_level: request.current_step,
      status: action,
      approver_id: employee.id,
      remarks: remarks || null,
      actioned_at: new Date().toISOString(),
    },
  ])

  // 6. Handle Rejection (Fails immediately)
  if (action === "rejected") {
    await supabaseAdmin
      .from("approval_requests")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", requestId)

    await supabaseAdmin
      .from(request.module)
      .update({ status: "rejected" })
      .eq("id", request.record_id)
    return { success: true, status: "rejected" }
  }

  // 7. Handle Approval (Check if there is a Next Step)
  const { data: nextStep } = await supabaseAdmin
    .from("approval_rules")
    .select("id")
    .eq("module", request.module)
    .eq("step_level", request.current_step + 1)
    .limit(1)
    .maybeSingle() // Use maybeSingle in case there are no more steps

  if (nextStep) {
    await supabaseAdmin
      .from("approval_requests")
      .update({
        current_step: request.current_step + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    return {
      success: true,
      status: "pending",
      next_step: request.current_step + 1,
    }
  } else {
    // Workflow completely finished! Mark request as approved.
    await supabaseAdmin
      .from("approval_requests")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", requestId)

    await supabaseAdmin
      .from(request.module)
      .update({ status: "approved" })
      .eq("id", request.record_id)

    return { success: true, status: "approved" }
  }
}
