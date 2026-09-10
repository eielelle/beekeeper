"use client"

import { columns } from "@/components/custom/data-table/columns/outlets"
import { DataTable } from "@/components/custom/data-table/core/data-table"
import { DataTableGlobalSearch } from "@/components/custom/data-table/core/data-table-global-search"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useUrlTableState } from "@/hooks/use-url-table-state"
import { FilterPayload } from "@/types/filter-payloads"
import { fetchOutlets } from "@/forms/queries/outlet.query"
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

export default function Page() {
  const router = useRouter()
  // Extract globalFilter from your hook
  const { page, size, sorting, globalFilter, columnFilters } =
    useUrlTableState()

  const outlets = useQuery({
    // Add globalFilter to the queryKey so it refetches on change
    queryKey: ["outlets", page, size, sorting, globalFilter, columnFilters],
    queryFn: () =>
      fetchOutlets({
        pageIndex: page - 1,
        pageSize: size,
        sorting,
        globalFilter: globalFilter,
        columnFilters: columnFilters as { id: string; value: FilterPayload }[],
      }),
    placeholderData: keepPreviousData,
  })

  const data = outlets?.data
  const outletsData = data?.data ?? []
  const rowCount = data?.rowCount ?? 0
  const pageCount = Math.ceil(rowCount / size)

  return (
    <div className="space-y-4">
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Outlets</CardTitle>
          <CardDescription>Review and manage your outlets</CardDescription>

          <CardAction>
            <Link href={"/d/outlets/new"}>
              <Button>New Outlet</Button>
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
            data={outletsData}
            pageCount={pageCount}
            rowCount={rowCount}
          />
        </CardContent>
      </Card>
    </div>
  )
}
