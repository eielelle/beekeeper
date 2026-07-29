import { toast } from "sonner"
import {
  fetchMyLeavesAction,
  fetchMyLeaveStatsAction,
  getLeaveAction,
  createLeaveAction,
  updateLeaveAction,
  deleteLeaveAction,
} from "@/actions/leave.action"
import { LeaveStoreType } from "./leave.query"

export type ApprovalLogType = {
  step_level: number
  status: string
  created_at: string
  approver:
    | { first_name: string; last_name: string }
    | { first_name: string; last_name: string }[]
    | null
}

export type MyLeaveStoreType = {
  id?: string | number
  employee_id?: number
  leave_date: string
  reason: string
  created_at?: string
  status?: "pending" | "approved" | "rejected"
  current_step?: number | null // <-- Added for Approval Workflow tracking
  approval_logs?: ApprovalLogType[] // <-- Added for the multi-step timeline
}

export type FetchMyLeavesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
  dateRange?: { from?: string; to?: string }
}

export async function fetchMyLeaves(params: FetchMyLeavesParams) {
  try {
    return await fetchMyLeavesAction(params)
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function getMyLeave(id: string) {
  const t = toast.loading("Fetching Leave record. Please wait.")
  try {
    // We reuse the standard getLeaveAction because CASL will inherently
    // block it if it doesn't belong to them (unless they are an admin)
    const data = await getLeaveAction(id)
    toast.dismiss(t)
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function createMyLeave(
  value: Omit<MyLeaveStoreType, "employee_id" | "approval_logs">
) {
  const t = toast.loading("Recording Leave. Please wait.")
  try {
    // We safely map the type. The backend inherently overwrites employee_id
    // with the logged-in user's ID for safety anyway.
    const data = await createLeaveAction(value as unknown as LeaveStoreType)
    toast.dismiss(t)
    toast.success("Leave successfully recorded.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "Unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateMyLeave(value: MyLeaveStoreType) {
  const t = toast.loading("Updating Leave. Please wait.")
  try {
    // The backend uses the record's ID to fetch the true employee_id for CASL checks.
    // It does not rely on the frontend's employee_id for updates.
    const data = await updateLeaveAction(value as unknown as LeaveStoreType)
    toast.dismiss(t)
    toast.success("Leave successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "Unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteMyLeave(id: string) {
  const t = toast.loading("Deleting Leave. Please wait.")
  try {
    // deleteLeaveAction inherently checks CASL ownership before deleting
    const data = await deleteLeaveAction(id)
    toast.dismiss(t)
    toast.success("Leave successfully deleted.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function fetchMyLeaveStats() {
  try {
    return await fetchMyLeaveStatsAction()
  } catch (error: any) {
    console.error(error)
    return { total: 0, upcoming: 0 }
  }
}
