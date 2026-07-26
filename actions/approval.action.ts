"use server"

import { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getServerAbility } from "@/lib/casl/server"

// With this:
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
// 1. TRIGGER WORKFLOW (Internal System Action)
// ==========================================
// Other server actions (like createExpenseAction) will call this.
// We do NOT check CASL here because the parent action already checked it.
export async function triggerApprovalWorkflow(
  moduleName: string,
  recordId: string,
  requesterId: number,
  orgId?: number
) {
  const supabase = await createClient()

  // 1. Check if the organization has approval rules for this specific module
  let query = supabase
    .from("approval_rules")
    .select("id")
    .eq("module", moduleName)
  if (orgId) query = query.eq("org_id", orgId)

  const { data: rules } = await query.order("step_level", { ascending: true })

  // If no rules exist, the workflow isn't required (auto-approved or manual)
  if (!rules || rules.length === 0) return null

  // 2. Initialize the request at Step 1 using Admin (bypassing RLS)
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

// Inside app/actions/approval.action.ts

export async function fetchMyPendingApprovalsAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const employee = await getCurrentEmployee(supabase, user.id)
  if (!employee) return []

  // 1. Build the dynamic condition to check for Role OR Specific Employee
  let ruleConditions = `employee_id.eq.${employee.id}`
  if (employee.role_id) {
    ruleConditions += `,role_id.eq.${employee.role_id}`
  }

  // 2. Find all rules assigned to this user's role OR their direct ID
  const { data: myRules } = await supabase
    .from("approval_rules")
    .select("module, step_level")
    .or(ruleConditions)

  if (!myRules || myRules.length === 0) return []

  // 3. Build the OR query to find the actual requests waiting at those specific steps
  // e.g., and(module.eq.expenses,current_step.eq.1),and(module.eq.leaves,current_step.eq.2)
  const requestConditions = myRules
    .map((r) => `and(module.eq.${r.module},current_step.eq.${r.step_level})`)
    .join(",")

  const { data: pendingRequests, error } = await supabase
    .from("approval_requests")
    .select(
      `
      id,
      module,
      record_id,
      status,
      current_step,
      created_at,
      requester:employees!requester_id(id, first_name, last_name, avatar_url)
    `
    )
    .eq("status", "pending")
    .or(requestConditions)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return pendingRequests
}

// ==========================================
// 3. PROCESS APPROVAL/REJECTION (Actioned by Managers)
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

  // 1. CASL Security Check (Ensure they have general approval rights)
  const ability = await getServerAbility()
  if (ability.cannot("update", "approval_requests")) {
    throw new Error(
      "Forbidden: You do not have permission to process approvals."
    )
  }

  // 2. Fetch current request state via Admin
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

  // 3. Log the manager's action securely
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

  // 4. Handle Rejection (Fails immediately)
  if (action === "rejected") {
    await supabaseAdmin
      .from("approval_requests")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", requestId)

    // Dynamically update the source table to rejected!
    await supabaseAdmin
      .from(request.module)
      .update({ status: "rejected" })
      .eq("id", request.record_id)
    return { success: true, status: "rejected" }
  }

  // 5. Handle Approval (Check if there is a Next Step)
  const { data: nextStep } = await supabaseAdmin
    .from("approval_rules")
    .select("id")
    .eq("module", request.module)
    .eq("step_level", request.current_step + 1)
    .single()

  if (nextStep) {
    // Escalate to the next manager in the chain
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

    // Dynamically update the source table to fully approved!
    await supabaseAdmin
      .from(request.module)
      .update({ status: "approved" })
      .eq("id", request.record_id)

    return { success: true, status: "approved" }
  }
}
