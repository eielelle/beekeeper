"use client"

import { columns } from "@/components/custom/data-table/columns/department"
import { DataTable } from "@/components/custom/data-table/core/data-table"
import { DataTableGlobalSearch } from "@/components/custom/data-table/core/data-table-global-search"
import { fetchDepartments } from "@/forms/queries/department.query"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useUrlTableState } from "@/hooks/use-url-table-state"

export default function Tabletest() {
  // Extract globalFilter from your hook
  const { page, size, sorting, globalFilter } = useUrlTableState()

  const attendances = useQuery({
    // Add globalFilter to the queryKey so it refetches on change
    queryKey: ["departments", page, size, sorting, globalFilter],
    queryFn: () =>
      fetchDepartments({
        pageIndex: page - 1,
        pageSize: size,
        sorting,
        globalFilter: globalFilter,
      }),
    placeholderData: keepPreviousData,
  })

  const a = attendances?.data
  const d = a?.data ?? []
  const rowCount = a?.rowCount ?? 0
  const pageCount = Math.ceil(rowCount / size)

  return (
    <div className="space-y-4">
      {/* TABLE */}
      <DataTable
        tkey="att"
        columns={columns}
        data={d}
        pageCount={pageCount}
        rowCount={rowCount}
      />
    </div>
  )
}
