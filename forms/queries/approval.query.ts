import {
  fetchMyPendingApprovalsAction,
  processApprovalAction,
} from "@/actions/approval.action"
import { toast } from "sonner"

// ==========================================
// TYPES
// ==========================================

export type ApprovalRequestType = {
  id: string
  module: string
  record_id: string
  status: "pending" | "approved" | "rejected"
  current_step: number
  created_at: string
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

export async function fetchMyPendingApprovals(): Promise<
  ApprovalRequestType[]
> {
  try {
    const data = await fetchMyPendingApprovalsAction()
    // Cast the returned data to our frontend type
    return data as unknown as ApprovalRequestType[]
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

export async function processApproval(
  requestId: string,
  action: "approved" | "rejected",
  remarks?: string
) {
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
