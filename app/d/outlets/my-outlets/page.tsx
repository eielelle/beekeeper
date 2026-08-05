"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ColumnDef,
  SortingState,
  PaginationState,
  Updater,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/table"

// Queries
import { OutletStoreType } from "@/forms/queries/outlet.query"
import { fetchMyAssignedOutlets } from "@/forms/queries/employee-outlet.query"

export default function MyOutletsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // --- URL-based Pagination State ---
  const pageIndex = Number(searchParams.get("page") ?? "0")
  const pageSize = Number(searchParams.get("size") ?? "10")

  const pagination = React.useMemo<PaginationState>(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize]
  )

  const setPagination = React.useCallback(
    (updater: Updater<PaginationState>) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", newPagination.pageIndex.toString())
      params.set("size", newPagination.pageSize.toString())
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pagination, searchParams, pathname, router]
  )

  // --- Table Control States ---
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])

  // --- Data Fetching ---
  // The server automatically identifies the user making the request.
  const { data: outletsData, isLoading } = useQuery({
    queryKey: [
      "my-outlets",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
    ],
    queryFn: () =>
      fetchMyAssignedOutlets({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
      }),
  })

  const displayOutlets = (outletsData?.data as OutletStoreType[]) || []
  const totalCount = outletsData?.rowCount ?? 0

  // --- Table Columns ---
  const columns = React.useMemo<ColumnDef<OutletStoreType>[]>(
    () => [
      {
        accessorKey: "outlet_code",
        header: () => (
          <Button
            variant="ghost"
            className="-ml-3 !h-6 !px-2 text-xs font-semibold text-gray-700 dark:text-gray-300"
            onClick={() => {
              setSorting([
                {
                  id: "outlet_code",
                  desc:
                    sorting[0]?.id === "outlet_code" ? !sorting[0].desc : false,
                },
              ])
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
          >
            Code
            <ArrowUpDown className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold whitespace-nowrap text-muted-foreground">
            {row.getValue("outlet_code")}
          </span>
        ),
      },
      {
        accessorKey: "outlet_name",
        header: () => (
          <Button
            variant="ghost"
            className="-ml-3 !h-6 !px-2 text-xs font-semibold text-gray-700 dark:text-gray-300"
            onClick={() => {
              setSorting([
                {
                  id: "outlet_name",
                  desc:
                    sorting[0]?.id === "outlet_name" ? !sorting[0].desc : false,
                },
              ])
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
          >
            Outlet Name
            <ArrowUpDown className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const distributor = row.original.distributor
          return (
            <div className="flex max-w-[200px] flex-col truncate sm:max-w-[300px]">
              {distributor && (
                <span className="mb-0.5 truncate text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
                  {distributor.outlet_name}
                </span>
              )}
              <span className="truncate text-sm font-medium text-foreground">
                {row.getValue("outlet_name")}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "address",
        header: () => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Address
          </span>
        ),
        cell: ({ row }) => (
          <span
            className="block max-w-[150px] truncate text-xs text-muted-foreground sm:max-w-[250px]"
            title={row.getValue("address")}
          >
            {row.getValue("address") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "region",
        header: () => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Region
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.getValue("region") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "province",
        header: () => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Province
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.getValue("province") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "city",
        header: () => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            City
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.getValue("city") || "—"}
          </span>
        ),
      },
    ],
    [sorting, setPagination]
  )

  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] flex-col space-y-6">
      <div className="flex-1 pb-6">
        <DataTable
          title="My Outlets"
          description="View the geographic territories and locations assigned to you."
          columns={columns}
          data={displayOutlets}
          rowCount={totalCount}
          isLoading={isLoading}
          searchPlaceholder="Search by code or name..."
          globalFilter={globalFilter}
          onSearchChange={(val) => {
            setGlobalFilter(val)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </div>
    </div>
  )
}
