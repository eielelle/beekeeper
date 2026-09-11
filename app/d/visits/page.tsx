"use client"

import { columns } from "@/components/custom/data-table/columns/visits"
import { DataTable } from "@/components/custom/data-table/core/data-table"
import { DataTableGlobalSearch } from "@/components/custom/data-table/core/data-table-global-search"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useUrlTableState } from "@/hooks/use-url-table-state"
import { FilterPayload } from "@/types/filter-payloads"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { fetchVisits } from "@/forms/queries/visit.query"

export default function Page() {
  // Extract globalFilter from your hook
  const { page, size, sorting, globalFilter, columnFilters } =
    useUrlTableState()

  const visits = useQuery({
    // Add globalFilter to the queryKey so it refetches on change
    queryKey: ["visits", page, size, sorting, globalFilter, columnFilters],
    queryFn: () =>
      fetchVisits({
        pageIndex: page - 1,
        pageSize: size,
        sorting,
        globalFilter: globalFilter,
        columnFilters: columnFilters as { id: string; value: FilterPayload }[],
      }),
    placeholderData: keepPreviousData,
  })

  const visitData = visits?.data
  const innerData = visitData?.data ?? []
  const rowCount = visitData?.rowCount ?? 0
  const pageCount = Math.ceil(rowCount / size)

  return (
    <div className="space-y-4">
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Visit Logs</CardTitle>
          <CardDescription>View and manage visit logs</CardDescription>
        </CardHeader>
      </Card>

      {/* TABLE */}
      <DataTable
        tkey="att"
        columns={columns}
        data={innerData}
        pageCount={pageCount}
        rowCount={rowCount}
      />
    </div>
  )
}
