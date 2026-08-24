// app/users/columns.ts
import { DepartmentType } from "@/forms/queries/department.query"
import { createAppColumnHelper } from "@/hooks/use-data-table"
import { ColumnSort } from "../core/data-table-column-header"

const columnHelper = createAppColumnHelper<DepartmentType>()

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: (props) => <ColumnSort column={props.column} label="Department" />,
  }),
  columnHelper.accessor("code", {
    header: (props) => <ColumnSort column={props.column} label="Code" />,
  }),
])
