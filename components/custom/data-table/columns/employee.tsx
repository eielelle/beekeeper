import {
  EmployeeStoreType,
  removeEmployee,
} from "@/forms/queries/employee.query"
import { createAppColumnHelper } from "@/hooks/use-data-table"
import { ColumnSort } from "../core/data-table-column-header"
import { CustomColumnMeta } from "@/types/filter-payloads" // <-- Adjust path to where you saved this interface
import { Button } from "@/components/ui/button"
import { Edit, Eye, Trash } from "lucide-react"
import Link from "next/link"
import { DeleteAction } from "../../dialogs/delete-dialog"

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
    header: () => <div className="flex h-full items-center">Actions</div>,
    cell: ({ row }) => {
      const employee = row.original

      return (
        <div className="flex gap-1">
          <Link href={`/d/employees/edit/${employee.id}`}>
            <Button size={"xs"} variant={"ghost"}>
              <Eye />
            </Button>
          </Link>
          <Link href={`/d/employees/edit/${employee.id}`}>
            <Button size={"xs"} variant={"ghost"}>
              <Edit />
            </Button>
          </Link>
          <DeleteAction
            id={row.original.id!}
            deleteFn={async (id) => {
              await removeEmployee(id.toString())
            }}
            queryKeyToInvalidate={["employees"]}
            entityName="employee"
          />
        </div>
      )
    },
  }),
])
