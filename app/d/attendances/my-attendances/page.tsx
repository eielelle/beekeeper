"use client"

import { columns } from "@/components/custom/data-table/columns/attendance"
import { DataTable } from "@/components/custom/data-table/core/data-table"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { fetchMyAttendanceLogs } from "@/forms/queries/attendance.query"
import { useUrlTableState } from "@/hooks/use-url-table-state"
import { FilterPayload } from "@/types/filter-payloads"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Page() {
  // Extract globalFilter from your hook
  const { page, size, sorting, globalFilter, columnFilters } =
    useUrlTableState()

  const router = useRouter()

  const employees = useQuery({
    // Add globalFilter to the queryKey so it refetches on change
    queryKey: ["employees", page, size, sorting, globalFilter, columnFilters],
    queryFn: () =>
      fetchMyAttendanceLogs({
        pageIndex: page - 1,
        pageSize: size,
        sorting,
        globalFilter: globalFilter,
        columnFilters: columnFilters as { id: string; value: FilterPayload }[],
      }),
    placeholderData: keepPreviousData,
  })

  const employeeData = employees?.data
  const innerData = employeeData?.data ?? []
  const rowCount = employeeData?.rowCount ?? 0
  const pageCount = Math.ceil(rowCount / size)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My Attendances</CardTitle>
          <CardDescription>View your attendance logs</CardDescription>
        </CardHeader>
      </Card>

      {/* TABLE */}
      <DataTable
        tkey="att"
        columns={columns}
        data={innerData}
        pageCount={pageCount}
        rowCount={rowCount}
        onRowClick={(row) => {
          const employee = row.original
          router.push(`/d/employees/view/${employee.id}`)
        }}
      />
    </div>
  )
}
