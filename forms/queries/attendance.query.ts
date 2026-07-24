import {
  fetchAttendanceLogsAction,
  fetchMyAttendanceLogsAction,
  fetchAttendanceStatsAction,
  fetchMyAttendanceStatsAction,
  createAttendanceAction,
  updateAttendanceAction,
  deleteAttendanceAction,
} from "@/actions/attendance.action" // Adjust path if needed
import { toast } from "sonner"

// --- TYPES ---
export type AttendanceLogType = {
  id: number
  time_in: string | null
  time_out: string | null
  time_in_lat: number | null
  time_in_long: number | null
  time_out_lat: number | null
  time_out_long: number | null
  time_in_attachment: string | null
  time_out_attachment: string | null
  created_at: string
  employee: {
    id: number
    first_name: string | null
    last_name: string | null
    employee_no: string | null
    avatar_url: string | null
  } | null
}

export type FetchAttendanceLogsParams = {
  pageIndex: number
  pageSize: number
  sorting?: { id: string; desc: boolean }[]
  statusFilter?: string
  employeeId?: string
  dateRange?: { from?: string; to?: string }
}

// ==========================================
// ADMIN FETCH WRAPPERS
// ==========================================
export async function fetchAttendanceLogs(params: FetchAttendanceLogsParams) {
  try {
    const response = await fetchAttendanceLogsAction(params)
    return {
      data: response.data as unknown as AttendanceLogType[],
      rowCount: response.rowCount,
    }
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function fetchAttendanceStats({
  dateRange,
}: {
  dateRange?: { from?: string; to?: string }
}) {
  try {
    return await fetchAttendanceStatsAction(dateRange)
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

// ==========================================
// PERSONAL (EMPLOYEE) FETCH WRAPPERS
// ==========================================
export async function fetchMyAttendanceLogs(
  params: Omit<FetchAttendanceLogsParams, "employeeId">
) {
  try {
    const response = await fetchMyAttendanceLogsAction(params)
    return {
      data: response.data as unknown as AttendanceLogType[],
      rowCount: response.rowCount,
    }
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function fetchMyAttendanceStats({
  dateRange,
}: {
  dateRange?: { from?: string; to?: string }
}) {
  try {
    return await fetchMyAttendanceStatsAction(dateRange)
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

// ==========================================
// STANDARD CRUD WRAPPERS
// ==========================================
export async function createAttendance(value: any) {
  const t = toast.loading("Creating attendance log...")
  try {
    const data = await createAttendanceAction(value)
    toast.dismiss(t)
    toast.success("Attendance successfully created.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function updateAttendance(id: string | number, value: any) {
  const t = toast.loading("Updating attendance log...")
  try {
    const data = await updateAttendanceAction(id, value)
    toast.dismiss(t)
    toast.success("Attendance successfully updated.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function deleteAttendance(id: string | number) {
  const t = toast.loading("Deleting attendance log...")
  try {
    const data = await deleteAttendanceAction(id)
    toast.dismiss(t)
    toast.success("Attendance successfully deleted.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}
