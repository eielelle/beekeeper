import { toast } from "sonner"
import {
  fetchLeavesAction,
  getLeaveAction,
  createLeaveAction,
  updateLeaveAction,
  deleteLeaveAction,
  fetchLeaveStatsAction,
  searchEmployeeOptionsAction,
} from "@/actions/leave.action"

export type LeaveStoreType = {
  id?: string | number
  employee_id: number
  leave_date: string
  reason: string
  created_at?: string
  status?: "pending" | "approved" | "rejected"
  // Joined relation for the UI
  employee?: { first_name: string; last_name: string } | null
}

export type FetchLeavesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
  dateRange?: { from?: string; to?: string }
}

export async function fetchLeaves(params: FetchLeavesParams) {
  try {
    return await fetchLeavesAction(params)
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function getLeave(id: string) {
  const t = toast.loading("Fetching Leave record. Please wait.")
  try {
    const data = await getLeaveAction(id)
    toast.dismiss(t)
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function createLeave(value: LeaveStoreType) {
  const t = toast.loading("Creating Leave record. Please wait.")
  try {
    const data = await createLeaveAction(value)
    toast.dismiss(t)
    toast.success("Leave successfully recorded.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function updateLeave(value: LeaveStoreType) {
  const t = toast.loading("Updating Leave record. Please wait.")
  try {
    const data = await updateLeaveAction(value)
    toast.dismiss(t)
    toast.success("Leave successfully updated.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function deleteLeave(id: string) {
  const t = toast.loading("Deleting Leave record. Please wait.")
  try {
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

export async function fetchLeaveStats() {
  try {
    return await fetchLeaveStatsAction()
  } catch (error: any) {
    console.error(error)
    return { total: 0, upcoming: 0 }
  }
}

export async function searchEmployeeOptions(searchTerm: string) {
  try {
    return await searchEmployeeOptionsAction(searchTerm)
  } catch (error: any) {
    console.error(error)
    toast.error(`ERR: ${error.message}`)
    return [] // Return an empty array so the UI dropdown doesn't crash on failure
  }
}
