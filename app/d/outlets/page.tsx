"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ColumnDef,
  SortingState,
  PaginationState,
  Updater,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  TrendingUp,
  Store,
  Truck,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { DataTable } from "@/components/custom/data-table/table"
import { FilterField } from "@/components/custom/filter/dynamic-filter"
import { SortOption } from "@/components/custom/sort/dynamic-sorter"

import {
  deleteOutlet,
  fetchOutlets,
  fetchOutletStats,
  OutletStoreType,
} from "@/forms/queries/outlet.query"
import { OutletForm } from "@/forms/outlet.form"

// Define the fields configuration for your DynamicFilter
const filterFields: FilterField[] = [
  {
    id: "type",
    label: "Outlet Type",
    type: "select",
    options: [
      { label: "Distributors", value: "distributors" },
      { label: "Outlets with no Distributor", value: "no_distributor" },
      { label: "Outlets with Distributor", value: "has_distributor" },
    ],
    placeholder: "Filter by type",
  },
  {
    id: "dateFrom",
    label: "Date From",
    type: "date",
  },
  {
    id: "dateTo",
    label: "Date To",
    type: "date",
  },
]

// Define sort options for the DynamicSorter
const sortOptions: SortOption[] = [
  { label: "Outlet Name (A-Z)", value: "outlet_name-false" },
  { label: "Outlet Name (Z-A)", value: "outlet_name-true" },
  { label: "Outlet Code (A-Z)", value: "outlet_code-false" },
  { label: "Outlet Code (Z-A)", value: "outlet_code-true" },
  { label: "Created (Newest)", value: "created_at-true" },
  { label: "Created (Oldest)", value: "created_at-false" },
]

export default function OutletsPage() {
  const queryClient = useQueryClient()

  // --- Next.js Navigation ---
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // --- URL-based Pagination State ---
  const pageIndex = Number(searchParams.get("page") ?? "0")
  const pageSize = Number(searchParams.get("size") ?? "15")

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
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ])

  // --- Unified Filter State for DynamicFilter ---
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >({})

  const handleApplyFilters = (newValues: Record<string, string>) => {
    setFilterValues(newValues)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const handleClearFilters = () => {
    setFilterValues({})
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const handleSortingChange = (updater: Updater<SortingState>) => {
    setSorting(updater)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  // --- FILTER FIX: Use undefined instead of "all" so Supabase ignores it ---
  const distributorFilter =
    filterValues.type && filterValues.type.trim() !== ""
      ? filterValues.type
      : undefined

  const dateFrom = filterValues.dateFrom || ""
  const dateTo = filterValues.dateTo || ""

  // --- Supabase Query: Table Data ---
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

  // --- Supabase Query: Stats ---
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["outlets", "stats"],
    queryFn: fetchOutletStats,
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
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold text-gray-700 dark:text-gray-300"
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
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
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
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold text-gray-700 dark:text-gray-300"
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
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
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
        accessorKey: "is_distributor",
        header: () => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Type
          </span>
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.getValue("is_distributor") ? "default" : "secondary"}
            className="h-5 px-1.5 py-0 text-[10px] whitespace-nowrap"
          >
            {row.getValue("is_distributor") ? "Distributor" : "Outlet"}
          </Badge>
        ),
      },
      {
        accessorKey: "is_active",
        header: () => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Status
          </span>
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.getValue("is_active") ? "outline" : "destructive"}
            className={`h-5 px-1.5 py-0 text-[10px] whitespace-nowrap ${
              row.getValue("is_active")
                ? "border-emerald-500/30 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                : ""
            }`}
          >
            {row.getValue("is_active") ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "created_at",
        header: () => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Created At
          </span>
        ),
        cell: ({ row }) => {
          const raw = row.getValue("created_at") as string
          return raw ? (
            <span className="text-xs whitespace-nowrap text-muted-foreground">
              {new Date(raw).toLocaleDateString()}
            </span>
          ) : (
            "—"
          )
        },
      },
    ],
    [sorting, setPagination]
  )

  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] flex-col space-y-6">
      {/* Stats Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outlets</CardTitle>
            <Store className="h-4 w-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-[60px] bg-primary-foreground/20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {statsData?.outlets ?? 0}
                </div>
                <p className="mt-1 flex items-center text-xs text-primary-foreground/80">
                  Total mapped locations
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distributors</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {statsData?.distributors ?? 0}
                </div>
                <p className="mt-1 flex items-center text-xs text-muted-foreground">
                  Active delivery hubs
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {statsData?.active ?? 0}
                </div>
                <p className="mt-1 flex items-center text-xs font-medium text-emerald-500">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Currently operational
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {statsData?.inactive ?? 0}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Disabled locations
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Data Table */}
      <div className="flex-1 pb-6">
        <DataTable
          title="Outlets"
          description="Manage your business outlets and distributors."
          entityName="Outlet"
          columns={columns}
          data={data?.data ?? []}
          rowCount={data?.rowCount ?? 0}
          isLoading={isLoading}
          searchPlaceholder="Search by code or name..."

          // Data Table State Props
          globalFilter={globalFilter}
          onSearchChange={setGlobalFilter}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={handleSortingChange}

          // Dynamic Toolbars
          sortOptions={sortOptions}
          filterFields={filterFields}
          filterValues={filterValues}
          onFilterChange={handleApplyFilters}
          onFilterClear={handleClearFilters}

          // Form & Actions
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
    </div>
  )
}
