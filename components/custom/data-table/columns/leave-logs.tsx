import { createAppColumnHelper } from "@/hooks/use-data-table"
import { ColumnSort } from "../core/data-table-column-header"
import { CustomColumnMeta } from "@/types/filter-payloads"
import { LeaveType } from "@/forms/queries/leave.query"
import { formatSupabaseDate } from "@/lib/helpers/date"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

const columnHelper = createAppColumnHelper<LeaveType>()

export const columns = columnHelper.columns([
  columnHelper.display({
    id: "employee_no",
    header: () => <div className="flex h-full items-center">Employee No</div>,
    cell: (props) => {
      return props.row.original.employee?.employee_no || "N/A"
    },
  }),

  columnHelper.display({
    id: "employee",
    header: () => <div className="flex h-full items-center">Employee</div>,
    cell: (props) => {
      const emp = props.row.original.employee
      if (!emp) return "N/A"
      return `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "N/A"
    },
  }),

  columnHelper.accessor("leave_date_from", {
    header: (props) => <ColumnSort column={props.column} label="From Date" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
    cell: (props) => {
      const date = props.row.original.leave_date_from
      if (!date) return "-"
      return formatSupabaseDate(date, { preset: "short" })
    },
  }),

  columnHelper.accessor("leave_date_to", {
    header: (props) => <ColumnSort column={props.column} label="To Date" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
    cell: (props) => {
      const date = props.row.original.leave_date_to
      if (!date) return "-"
      return formatSupabaseDate(date, { preset: "short" })
    },
  }),

  columnHelper.accessor("reason", {
    header: (props) => <ColumnSort column={props.column} label="Reason" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
    cell: (props) => {
      const reason = props.row.original.reason
      return (
        <div className="max-w-[200px] truncate" title={reason}>
          {reason || "-"}
        </div>
      )
    },
  }),

  columnHelper.accessor("status", {
    header: (props) => <ColumnSort column={props.column} label="Status" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
    cell: (props) => {
      const status = props.row.original.status || "pending"

      const variantMap: Record<
        string,
        "default" | "secondary" | "destructive" | "outline"
      > = {
        approved: "default",
        pending: "secondary",
        rejected: "destructive",
      }

      return (
        <Badge
          variant={variantMap[status.toLowerCase()] || "outline"}
          className="capitalize"
        >
          {status}
        </Badge>
      )
    },
  }),
])
