import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

// Configuration for testing environment
const TEST_EMPLOYEE_ID = 1
const TEST_ORG_ID = 1 // Fallback or placeholder testing org ID

export type ClockInParamType = {
  long: number
  lat: number
}

/**
 * Commits a single raw attendance log to Supabase
 */
async function logAttendance(
  type: "time_in" | "time_out",
  geo: ClockInParamType
) {
  const displayType = type === "time_in" ? "Clock In" : "Clock Out"
  const t = toast.loading(`Processing ${displayType}. Please wait...`)

  const logPayload = {
    type,
    long: geo.long,
    lat: geo.lat,
    employee_id: TEST_EMPLOYEE_ID,
    org_id: TEST_ORG_ID,
  }

  const { data, error } = await supabase
    .from("raw_attendance_logs")
    .insert([logPayload])
    .select()
    .single()

  toast.dismiss(t)

  if (error) {
    toast.error(`Failed to register ${displayType}: ${error.message}`)
    throw error
  }

  toast.success(`Successfully registered ${displayType}!`)
  return data
}

/**
 * Helper method to log a "time_in" event
 */
export async function clockIn(geo: ClockInParamType) {
  return logAttendance("time_in", geo)
}

/**
 * Helper method to log a "time_out" event
 */
export async function clockOut(geo: ClockInParamType) {
  return logAttendance("time_out", geo)
}

/**
 * Optional: Fetches recent testing logs for confirmation
 */
export async function fetchRecentTestLogs() {
  const { data, error } = await supabase
    .from("raw_attendance_logs")
    .select("*")
    .eq("employee_id", TEST_EMPLOYEE_ID)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}
