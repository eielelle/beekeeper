// app/users/columns.ts
import { AttendanceLogType } from "@/forms/queries/attendance.query"
import { createAppColumnHelper } from "@/hooks/use-data-table"

const columnHelper = createAppColumnHelper<AttendanceLogType>()

export const columns = columnHelper.columns([
  columnHelper.accessor("time_in", {
    header: "Time In",
  }),
  columnHelper.accessor("time_out", {
    header: "Time Out",
  }),
])
