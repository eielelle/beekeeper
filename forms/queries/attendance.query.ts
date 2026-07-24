import {
  fetchAttendanceLogsAction,
  fetchAttendanceStatsAction,
} from "@/actions/attendance.action"
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

// --- FETCH LOGS (CUSTOM TABLE) ---
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

// --- FETCH STATS ---
export async function fetchAttendanceStats({
  dateRange,
}: {
  dateRange?: { from?: string; to?: string }
}) {
  try {
    const stats = await fetchAttendanceStatsAction(dateRange)
    return stats
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}
