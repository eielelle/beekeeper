"use client"

import { columns } from "@/components/custom/data-table/columns/employee"
import { DataTable } from "@/components/custom/data-table/core/data-table"
import { DataTableGlobalSearch } from "@/components/custom/data-table/core/data-table-global-search"
import { fetchEmployees } from "@/forms/queries/employee.query"
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
      fetchEmployees({
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
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>View and manage employees</CardDescription>
          <CardAction>
            <Link href={"/d/employees/new"}>
              <Button>
                <Plus /> Create
              </Button>
            </Link>
          </CardAction>
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
