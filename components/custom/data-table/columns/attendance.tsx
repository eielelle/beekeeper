import { createAppColumnHelper } from "@/hooks/use-data-table"
import { ColumnSort } from "../core/data-table-column-header"
import { CustomColumnMeta } from "@/types/filter-payloads" // <-- Adjust path to where you saved this interface
import { AttendanceLogType } from "@/forms/queries/attendance.query"

const columnHelper = createAppColumnHelper<AttendanceLogType>()

export const columns = columnHelper.columns([
  columnHelper.accessor("time_in", {
    header: (props) => <ColumnSort column={props.column} label="Time In" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("time_out", {
    header: (props) => <ColumnSort column={props.column} label="Time Out" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.display({
    id: "time_in_location", // display columns require a unique id
    header: "Time In Location",
    cell: (props) => {
      const lat = props.row.original.time_in_lat
      const lng = props.row.original.time_in_long

      if (!lat || !lng) return "N/A"

      return `${lat}, ${lng}`
    },
  }),

  columnHelper.display({
    id: "time_out_location", // display columns require a unique id
    header: "Time Out Location",
    cell: (props) => {
      const lat = props.row.original.time_out_lat
      const lng = props.row.original.time_out_long

      if (!lat || !lng) return "N/A"

      return `${lat}, ${lng}`
    },
  }),

  columnHelper.display({
    id: "at_work",
    header: "At Work",
    cell: (props) => {
      const timeIn = props.row.original.time_in
      const timeOut = props.row.original.time_out

      // If either timestamp is missing (e.g., they haven't clocked out yet), return a fallback
      if (!timeIn || !timeOut) return "-"

      const start = new Date(timeIn).getTime()
      const end = new Date(timeOut).getTime()
      const diffMs = end - start

      // Catch negative differences just in case of dirty data
      if (diffMs < 0) return "-"

      // Convert ms to total minutes, then extract hours and remaining minutes
      const totalMinutes = Math.floor(diffMs / (1000 * 60))
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60

      // Pad with leading zeros (e.g., "08:05")
      const formattedHours = String(hours).padStart(2, "0")
      const formattedMinutes = String(minutes).padStart(2, "0")

      return `${formattedHours}:${formattedMinutes}`
    },
  }),
])
