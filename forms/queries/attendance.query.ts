import { supabase } from "@/lib/supabase"

export type AttendanceLogType = {
  id: number
  time_in: string | null
  time_out: string | null
  time_in_lat: number | null
  time_in_long: number | null
  employee: {
    id: number
    first_name: string
    last_name: string
    employee_no: string
    avatar_url: string
  }
}

export async function fetchAttendances() {
  const { data, error } = await supabase
    .from("attendances")
    .select(
      `
      id,
      time_in,
      time_out,
      time_in_lat,
      time_in_long,
      time_out_lat,
      time_out_long,
      employee:employees!employee_id (
        id,
        first_name,
        last_name,
        employee_no,
        avatar_url
      )
    `
    )
    .order("time_in", { ascending: false })

  if (error) throw new Error(error.message)
  return data as any as AttendanceLogType[] // Type cast for nested join
}
