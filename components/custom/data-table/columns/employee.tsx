import { EmployeeStoreType } from "@/forms/queries/employee.query"
import { createAppColumnHelper } from "@/hooks/use-data-table"
import { ColumnSort } from "../core/data-table-column-header"
import { CustomColumnMeta } from "@/types/filter-payloads" // <-- Adjust path to where you saved this interface
import { Button } from "@/components/ui/button"
import { Edit, Trash } from "lucide-react"

const columnHelper = createAppColumnHelper<EmployeeStoreType>()

export const columns = columnHelper.columns([
  columnHelper.accessor("employee_no", {
    header: (props) => <ColumnSort column={props.column} label="Employee No" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("first_name", {
    header: (props) => <ColumnSort column={props.column} label="First Name" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("middle_name", {
    header: (props) => <ColumnSort column={props.column} label="Middle Name" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("last_name", {
    header: (props) => <ColumnSort column={props.column} label="Last Name" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("work_email", {
    header: (props) => <ColumnSort column={props.column} label="Work Email" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("work_phone", {
    header: (props) => <ColumnSort column={props.column} label="Work Phone" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("gender", {
    header: (props) => <ColumnSort column={props.column} label="Gender" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const employee = row.original

      return (
        <div className="flex gap-2">
          <Button size={"xs"} variant={"ghost"}>
            <Edit />
          </Button>
          <Button size={"xs"} variant={"ghost"}>
            <Trash />
          </Button>
        </div>
      )
    },
  }),
])
