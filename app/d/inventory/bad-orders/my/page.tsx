"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ColumnDef,
  SortingState,
  PaginationState,
  Updater,
} from "@tanstack/react-table"
import {
  FileText,
  RefreshCw,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  PackageX,
} from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

import { DataTable } from "@/components/custom/data-table/table"
import {
  DynamicFilter,
  FilterField,
} from "@/components/custom/filter/dynamic-filter"

import {
  fetchMyBadOrders,
  fetchMyBadOrderStats,
  deleteBadOrder,
  BadOrderStoreType,
} from "@/forms/queries/bad_order.query"
import { BadOrderForm } from "@/forms/bad_order.form"

const filterFields: FilterField[] = [
  {
    id: "dateFrom",
    label: "Logged Date From",
    type: "date",
  },
  {
    id: "dateTo",
    label: "Logged Date To",
    type: "date",
  },
  {
    id: "type",
    label: "Bad Order Type",
    type: "text",
    placeholder: "e.g. return_to_wh",
  },
]

export default function MyBadOrdersPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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

  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
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

  const dateFrom = filterValues.dateFrom || ""
  const dateTo = filterValues.dateTo || ""
  const type = filterValues.type || ""

  const { data, isLoading } = useQuery({
    queryKey: [
      "my-bad-orders",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
      dateFrom,
      dateTo,
      type,
    ],
    queryFn: () =>
      fetchMyBadOrders({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
        filters: { dateFrom, dateTo, type },
      }),
  })

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["my-bad-orders-stats"],
    queryFn: fetchMyBadOrderStats,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteBadOrder(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bad-orders"] })
      queryClient.invalidateQueries({ queryKey: ["my-bad-orders-stats"] })
    },
  })

  const columns = React.useMemo<ColumnDef<BadOrderStoreType>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "created_at",
                  desc:
                    sorting[0]?.id === "created_at" ? !sorting[0].desc : true,
                },
              ])
            }
          >
            Logged Date
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const raw = row.getValue("created_at") as string
          return raw ? (
            <span className="font-semibold">
              {new Date(raw).toLocaleDateString()}
            </span>
          ) : (
            "—"
          )
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const rawType = row.getValue("type") as string
          const displayType =
            rawType === "for_disposal"
              ? "For Disposal"
              : rawType === "return_to_wh"
                ? "Return to WH"
                : rawType

          return (
            <Badge
              variant="outline"
              className="bg-blue-50/50 font-mono text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
            >
              {displayType || "N/A"}
            </Badge>
          )
        },
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <span
            className="block max-w-[250px] truncate text-muted-foreground"
            title={row.getValue("notes")}
          >
            {row.getValue("notes") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Approval Chain",
        cell: ({ row }) => {
          const status = (row.original.status as string) || "pending"
          const currentStep = row.original.current_step
          const logs = row.original.approval_logs || []

          let mainBadge
          if (status === "approved" || status === "completed") {
            mainBadge = (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 capitalize hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
              >
                Approved
              </Badge>
            )
          } else if (status === "rejected") {
            mainBadge = (
              <Badge variant="destructive" className="capitalize">
                Rejected
              </Badge>
            )
          } else {
            mainBadge = (
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-50 text-amber-600 capitalize dark:bg-amber-950/30 dark:text-amber-400"
              >
                Pending {currentStep ? `(Step ${currentStep})` : ""}
              </Badge>
            )
          }

          return (
            <div className="flex flex-col items-start gap-2 py-2">
              {mainBadge}
              {logs.length > 0 && (
                <div className="mt-1 flex min-w-[140px] flex-col gap-1 rounded-md border bg-muted/30 p-1.5 text-[11px] text-muted-foreground">
                  {logs.map((log: any, idx: number) => {
                    const emp = Array.isArray(log.approver)
                      ? log.approver[0]
                      : log.approver
                    const name = emp
                      ? `${emp.first_name} ${emp.last_name}`
                      : "Unknown"
                    return (
                      <div key={idx} className="flex items-center gap-1.5">
                        {log.status === "approved" ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span>
                          Step {log.step_level}:{" "}
                          <span className="font-medium">{name}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        },
      },
    ],
    [sorting]
  )

  return (
    <div className="flex flex-col space-y-6">
      {/* STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              My Total Logged
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">{statsData?.total ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Routing
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold text-amber-600">
                {statsData?.pending ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <PackageX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {statsData?.rejected ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DynamicFilter
        title="Filter My Orders"
        description="Search your bad orders by date and type."
        fields={filterFields}
        values={filterValues}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <DataTable
        title="My Bad Orders"
        description="Track the bad orders you have personally filed."
        entityName="Bad Order"
        columns={columns}
        data={data?.data ?? []}
        rowCount={data?.rowCount ?? 0}
        isLoading={isLoading}
        searchPlaceholder="Search by notes or type..."
        globalFilter={globalFilter}
        onSearchChange={setGlobalFilter}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}

        // Form Rendering
        renderForm={({ id, onClose }) => (
          <div className="max-h-[80vh] overflow-y-auto pr-1">
            <BadOrderForm editId={id?.toString()} onClose={onClose} />
          </div>
        )}

        // Deletion
        onDelete={async (id) => {
          await deleteMutation.mutateAsync(id)
        }}
        isDeleting={deleteMutation.isPending}
        getItemDisplayName={(item) =>
          `Bad Order (${item.type}) filed on ${new Date(item.created_at || "").toLocaleDateString()}`
        }
      />
    </div>
  )
}
