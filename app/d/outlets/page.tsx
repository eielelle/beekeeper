"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ColumnDef,
  SortingState,
  PaginationState,
  Updater,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { DataTable } from "@/components/custom/data-table/table"
import {
  deleteOutlet,
  fetchOutlets,
  OutletStoreType,
} from "@/forms/queries/outlet.query"
import { OutletForm } from "@/forms/outlet.form"

export default function Page() {
  const queryClient = useQueryClient()

  // --- Next.js Navigation ---
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

      // Update URL without scrolling to the top
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pagination, searchParams, pathname, router]
  )

  // --- Table Control States ---
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])

  // --- New Filter States ---
  const [distributorFilter, setDistributorFilter] = React.useState("all")
  const [dateFrom, setDateFrom] = React.useState<string>("")
  const [dateTo, setDateTo] = React.useState<string>("")

  // --- Supabase Query ---
  const { data, isLoading } = useQuery({
    queryKey: [
      "outlets",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
      distributorFilter,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      fetchOutlets({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
        distributorFilter,
        dateRange:
          dateFrom || dateTo
            ? {
                from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
                to: dateTo ? new Date(dateTo).toISOString() : undefined,
              }
            : undefined,
      }),
  })

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteOutlet(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outlets"] })
    },
  })

  // --- Table Columns ---
  const columns = React.useMemo<ColumnDef<OutletStoreType>[]>(
    () => [
      {
        accessorKey: "outlet_code",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "outlet_code",
                  desc:
                    sorting[0]?.id === "outlet_code" ? !sorting[0].desc : false,
                },
              ])
            }
          >
            Code
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono font-semibold">
            {row.getValue("outlet_code")}
          </span>
        ),
      },
      {
        accessorKey: "outlet_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "outlet_name",
                  desc:
                    sorting[0]?.id === "outlet_name" ? !sorting[0].desc : false,
                },
              ])
            }
          >
            Outlet Name
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const distributor = row.original.distributor
          return (
            <div className="flex flex-col">
              {/* Display distributor above outlet name if it exists */}
              {distributor && (
                <span className="mb-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  {distributor.outlet_name}
                </span>
              )}
              <span className="font-medium">{row.getValue("outlet_name")}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "is_distributor",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            variant={row.getValue("is_distributor") ? "default" : "secondary"}
          >
            {row.getValue("is_distributor") ? "Distributor" : "Outlet"}
          </Badge>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.getValue("is_active") ? "outline" : "destructive"}
          >
            {row.getValue("is_active") ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => {
          const raw = row.getValue("created_at") as string
          return raw ? new Date(raw).toLocaleDateString() : "—"
        },
      },
    ],
    [sorting]
  )

  return (
    <div className="flex flex-col space-y-4">
      {/* Custom Filters Layout */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        {/* Distributor Filter Dropdown */}
        <div>
          <p className="mb-2 text-xs font-semibold">Filter by Outlets</p>
          <Select
            value={distributorFilter}
            onValueChange={setDistributorFilter}
          >
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom">
              <SelectItem value="all">All Outlets</SelectItem>
              <SelectItem value="distributors">Distributors</SelectItem>
              <SelectItem value="no_distributor">
                Outlets with no Distributor
              </SelectItem>
              <SelectItem value="has_distributor">
                Outlets with Distributor
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <p className="mb-2 text-xs font-semibold">Date From</p>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-[150px]"
            />
          </div>
          <div className="flex flex-col">
            <p className="mb-2 text-xs font-semibold">Date To</p>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-[150px]"
            />
          </div>
        </div>

        {/* Optional Clear Filters Button */}
        {(dateFrom || dateTo || distributorFilter !== "all") && (
          <Button
            className="underline"
            variant="ghost"
            onClick={() => {
              setDateFrom("")
              setDateTo("")
              setDistributorFilter("all")
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <DataTable
        title="Outlets"
        description="Manage sales outlets, distributors, and location mapping"
        entityName="Outlet"
        columns={columns}
        data={data?.data ?? []}
        rowCount={data?.rowCount ?? 0}
        isLoading={isLoading}
        searchPlaceholder="Search outlets by code or name..."
        globalFilter={globalFilter}
        onSearchChange={setGlobalFilter}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        renderForm={({ id, onClose }) => (
          <div className="max-h-[80vh] overflow-y-auto pr-1">
            <OutletForm editId={id?.toString()} onClose={onClose} />
          </div>
        )}
        onDelete={async (id) => {
          await deleteMutation.mutateAsync(id)
        }}
        isDeleting={deleteMutation.isPending}
        getItemDisplayName={(item) =>
          `${item.outlet_code} (${item.outlet_name})`
        }
      />
    </div>
  )
}
