import { DepartmentType } from "@/forms/queries/department.query"
import { createAppColumnHelper } from "@/hooks/use-data-table"
import { ColumnSort } from "../core/data-table-column-header"
import { CustomColumnMeta } from "@/types/filter-payloads" // <-- Adjust path to where you saved this interface

const columnHelper = createAppColumnHelper<DepartmentType>()

export const columns = columnHelper.columns([
  columnHelper.accessor("created_at", {
    header: (props) => <ColumnSort column={props.column} label="Created At" />,
    meta: {
      filterVariant: "date",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("name", {
    header: (props) => <ColumnSort column={props.column} label="Department" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("code", {
    header: (props) => <ColumnSort column={props.column} label="Code" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),
])
