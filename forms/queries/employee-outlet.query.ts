import { toast } from "sonner"
import {
  getAssignedOutletsAction,
  getOutletsByIdsAction,
  assignOutletsToEmployeeAction,
  fetchMyAssignedOutletsAction,
} from "@/actions/employee_outlets.action"

// 1. Admin Query
export async function getAssignedOutlets(employeeId: string) {
  try {
    return await getAssignedOutletsAction(employeeId)
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    return []
  }
}

// 2. Admin Query
export async function getOutletsByIds(ids: string[]) {
  if (!ids || ids.length === 0) return []
  try {
    return await getOutletsByIdsAction(ids)
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    return []
  }
}

// 3. Admin Mutation
export async function assignOutletsToEmployee(payload: {
  employeeId: string
  outletIds: string[]
}) {
  const t = toast.loading("Updating assignments...")
  try {
    const success = await assignOutletsToEmployeeAction(payload)
    toast.dismiss(t)
    toast.success("Outlets successfully assigned.")
    return success
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

// 4. Employee Query
export async function fetchMyAssignedOutlets(params: {
  pageIndex: number
  pageSize: number
  globalFilter?: string
}) {
  try {
    return await fetchMyAssignedOutletsAction(params)
  } catch (error: any) {
    console.error("Error fetching my outlets:", error.message)
    toast.error(`ERR: ${error.message}`)
    return { data: [], rowCount: 0 }
  }
}
