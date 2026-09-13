import { toast } from "sonner"
import {
  fetchLeavesAction,
  getLeaveAction,
  createLeaveAction,
  updateLeaveAction,
  deleteLeaveAction,
} from "@/actions/leave.action"
import { FilterPayload } from "@/types/filter-payloads"
import { LeaveFormValues } from "@/forms/schemas/leave.schema"

export type LeaveType = {
  id?: string | number
  reason: string
  employee_id?: number | null
  created_at?: string
  status?: string
  leave_date_from: string
  leave_date_to: string
  // Relational data for Data Table
  employee?: {
    first_name: string
    last_name: string
    employee_no?: string
  } | null
}

export type FetchLeavesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
  columnFilters?: { id: string; value: FilterPayload }[]
}

export async function fetchLeaves(params: FetchLeavesParams) {
  const t = toast.loading("Fetching leaves. Please wait.")
  try {
    const response = await fetchLeavesAction(params)
    toast.dismiss(t)
    return response
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function getLeave(id: string) {
  const t = toast.loading("Fetching leave details. Please wait.")
  try {
    const data = await getLeaveAction(id)
    toast.dismiss(t)
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function createLeave(value: LeaveFormValues) {
  const t = toast.loading("Submitting leave request. Please wait.")
  try {
    const data = await createLeaveAction(value)
    toast.dismiss(t)
    toast.success("Leave request successfully submitted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateLeave(value: LeaveFormValues & { id: string }) {
  const t = toast.loading("Updating leave request. Please wait.")
  try {
    const data = await updateLeaveAction(value)
    toast.dismiss(t)
    toast.success("Leave request successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteLeave(id: string) {
  const t = toast.loading("Deleting leave request. Please wait.")
  try {
    const data = await deleteLeaveAction(id)
    toast.dismiss(t)
    toast.success("Leave request successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
