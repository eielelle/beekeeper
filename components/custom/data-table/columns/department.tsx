// app/users/columns.ts
import { DepartmentType } from "@/forms/queries/department.query"
import { createAppColumnHelper } from "@/hooks/use-data-table"

const columnHelper = createAppColumnHelper<DepartmentType>()

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: "Department",
  }),
  columnHelper.accessor("code", {
    header: "Code",
  }),
])
