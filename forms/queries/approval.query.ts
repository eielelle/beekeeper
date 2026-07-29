import {
  fetchMyPendingApprovalsAction,
  processApprovalAction,
} from "@/actions/approval.action"
import { toast } from "sonner"

// ==========================================
// TYPES
// ==========================================

export type PendingApproval = {
  id: string
  module: string
  record_id: string
  status: "pending" | "approved" | "rejected"
  current_step: number
  created_at: string
  requester_id: number
  requester: {
    id: number
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
}

// ==========================================
// FETCH WRAPPERS
// ==========================================

export async function fetchMyPendingApprovals(): Promise<PendingApproval[]> {
  try {
    const data = await fetchMyPendingApprovalsAction()

    // Safely normalize the requester object at runtime
    // (Supabase sometimes wraps relational joins in arrays)
    return data.map((item: any) => ({
      ...item,
      requester: Array.isArray(item.requester)
        ? item.requester[0]
        : item.requester,
    })) as PendingApproval[]
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

// ==========================================
// MUTATION WRAPPERS
// ==========================================

// Wrapped parameters in a single object to support React Query's mutate()
export async function processApproval({
  requestId,
  action,
  remarks,
}: {
  requestId: string
  action: "approved" | "rejected"
  remarks?: string
}) {
  const t = toast.loading(`Processing ${action}...`)
  try {
    const result = await processApprovalAction(requestId, action, remarks)

    toast.dismiss(t)

    if (result.status === "rejected") {
      toast.success("Request has been rejected.")
    } else if (result.status === "approved") {
      toast.success("Workflow complete. Request fully approved.")
    } else {
      toast.success(
        `Approved! Sent to step ${result.next_step} for further approval.`
      )
    }

    return result
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
