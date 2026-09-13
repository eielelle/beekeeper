"use client"

import { columns } from "@/components/custom/data-table/columns/leave-logs"
import { DataTable } from "@/components/custom/data-table/core/data-table"
import { DataTableGlobalSearch } from "@/components/custom/data-table/core/data-table-global-search"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useUrlTableState } from "@/hooks/use-url-table-state"
import { FilterPayload } from "@/types/filter-payloads"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { fetchLeaves } from "@/forms/queries/leave.query"

export default function Page() {
  const router = useRouter()
  // Extract globalFilter from your hook
  const { page, size, sorting, globalFilter, columnFilters } =
    useUrlTableState()

  const leaves = useQuery({
    // Add globalFilter to the queryKey so it refetches on change
    queryKey: ["leaves", page, size, sorting, globalFilter, columnFilters],
    queryFn: () =>
      fetchLeaves({
        pageIndex: page - 1,
        pageSize: size,
        sorting,
        globalFilter: globalFilter,
        columnFilters: columnFilters as { id: string; value: FilterPayload }[],
      }),
    placeholderData: keepPreviousData,
  })

  const data = leaves?.data
  const leavesData = data?.data ?? []
  const rowCount = data?.rowCount ?? 0
  const pageCount = Math.ceil(rowCount / size)

  return (
    <div className="space-y-4">
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>Review and manage leave requests</CardDescription>

          <CardAction>
            <Link href={"/d/leaves/view-leaves/new"}>
              <Button>Request Leave</Button>
            </Link>
          </CardAction>
        </CardHeader>
      </Card>

      <Card>
        <CardContent>
          {/* TABLE */}
          <DataTable
            tkey="att"
            columns={columns}
            data={leavesData}
            pageCount={pageCount}
            rowCount={rowCount}
          />
        </CardContent>
      </Card>
    </div>
  )
}
