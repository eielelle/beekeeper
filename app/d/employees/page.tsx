"use client"

import { columns } from "@/components/custom/data-table/columns/employee"
import { DataTable } from "@/components/custom/data-table/core/data-table"
import { DataTableGlobalSearch } from "@/components/custom/data-table/core/data-table-global-search"
import { fetchEmployees } from "@/forms/queries/employee.query"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useUrlTableState } from "@/hooks/use-url-table-state"
import { FilterPayload } from "@/types/filter-payloads"

export default function Tabletest() {
  // Extract globalFilter from your hook
  const { page, size, sorting, globalFilter, columnFilters } =
    useUrlTableState()

  const attendances = useQuery({
    // Add globalFilter to the queryKey so it refetches on change
    queryKey: ["employees", page, size, sorting, globalFilter, columnFilters],
    queryFn: () =>
      fetchEmployees({
        pageIndex: page - 1,
        pageSize: size,
        sorting,
        globalFilter: globalFilter,
        columnFilters: columnFilters as { id: string; value: FilterPayload }[],
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
