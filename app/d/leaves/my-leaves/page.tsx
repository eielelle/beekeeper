"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ColumnDef,
  SortingState,
  PaginationState,
  Updater,
} from "@tanstack/react-table"
import { Calendar, CheckSquare, ArrowUpDown } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { DataTable } from "@/components/custom/data-table/table"
import { FilterField } from "@/components/custom/filter/dynamic-filter"
import { SortOption } from "@/components/custom/sort/dynamic-sorter"

import {
  deleteMyLeave,
  fetchMyLeaves,
  fetchMyLeaveStats,
  MyLeaveStoreType,
} from "@/forms/queries/my_leave.query"
import { MyLeaveForm } from "@/forms/my_leave.form"

const filterFields: FilterField[] = [
  {
    id: "dateFrom",
    label: "Leave Date From",
    type: "date",
  },
  {
    id: "dateTo",
    label: "Leave Date To",
    type: "date",
  },
]

const sortOptions: SortOption[] = [
  { label: "Leave Date (Newest)", value: "leave_date-true" },
  { label: "Leave Date (Oldest)", value: "leave_date-false" },
  { label: "Filed On (Newest)", value: "created_at-true" },
  { label: "Filed On (Oldest)", value: "created_at-false" },
]

export default function MyLeavesPage() {
  const queryClient = useQueryClient()
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

  // --- Search, Filter & Sort State ---
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "leave_date", desc: true },
  ])
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >({})

  // --- Viewing State ---
  const [viewItem, setViewItem] = React.useState<MyLeaveStoreType | null>(null)

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

  const dateFrom = filterValues.dateFrom || ""
  const dateTo = filterValues.dateTo || ""

  // --- Data Fetching ---
  const { data, isLoading } = useQuery({
    queryKey: [
      "my-leaves",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      fetchMyLeaves({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
        dateRange:
          dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined,
      }),
  })

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["my-leaves", "stats"],
    queryFn: fetchMyLeaveStats,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteMyLeave(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] })
    },
  })

  // --- Columns Definition ---
  const columns = React.useMemo<ColumnDef<MyLeaveStoreType>[]>(
    () => [
      {
        accessorKey: "leave_date",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold text-gray-700 dark:text-gray-300"
            onClick={() => {
              setSorting([
                {
                  id: "leave_date",
                  desc:
                    sorting[0]?.id === "leave_date" ? !sorting[0].desc : true,
                },
              ])
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
          >
            Date
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const raw = row.getValue("leave_date") as string
          return raw ? (
            <span className="text-xs text-muted-foreground">
              {new Date(raw).toLocaleDateString()}
            </span>
          ) : (
            "—"
          )
        },
      },
      {
        accessorKey: "reason",
        header: () => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Reason
          </span>
        ),
        cell: ({ row }) => (
          <span
            className="block max-w-[200px] truncate text-xs text-muted-foreground sm:max-w-[300px]"
            title={row.getValue("reason")}
          >
            {row.getValue("reason")}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: () => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Filed On
          </span>
        ),
        cell: ({ row }) => {
          const raw = row.getValue("created_at") as string
          return raw ? (
            <span className="text-xs text-muted-foreground">
              {new Date(raw).toLocaleDateString()}
            </span>
          ) : (
            "—"
          )
        },
      },
      {
        accessorKey: "status",
        header: () => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Approvals
          </span>
        ),
        cell: ({ row }) => {
          const approvalLogs = row.original.approval_logs || []

          return (
            <div className="flex flex-col gap-2 py-1">
              {approvalLogs.length > 0 ? (
                approvalLogs.map((alog: any, idx: number) => {
                  const emp = Array.isArray(alog.approver)
                    ? alog.approver[0]
                    : alog.approver
                  const name = emp
                    ? `${emp.first_name} ${emp.last_name}`
                    : "Unknown"

                  return (
                    <div key={idx} className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
                        Step {alog.step_level}: {name}
                      </span>
                      <div>
                        {alog.status === "approved" ? (
                          <Badge
                            variant="secondary"
                            className="h-4 bg-green-100 px-1.5 py-0 text-[10px] text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                          >
                            Approved
                          </Badge>
                        ) : alog.status === "rejected" ? (
                          <Badge
                            variant="destructive"
                            className="h-4 px-1.5 py-0 text-[10px]"
                          >
                            Rejected
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="h-4 border-amber-500/30 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                          >
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  No approvers found
                </span>
              )}
            </div>
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
        <Card className="bg-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              My Total Leaves
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
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
              My Upcoming Leaves
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">
                {statsData?.upcoming ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Data Table */}
      <div className="flex-1 pb-6">
        <DataTable
          title="My Leaves"
          description="File and manage your leaves here"
          entityName="Leave Request"
          columns={columns}
          data={data?.data ?? []}
          rowCount={data?.rowCount ?? 0}
          isLoading={isLoading}
          searchPlaceholder="Search by reason..."

          // Data Table Props
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
            <MyLeaveForm editId={id?.toString()} onClose={onClose} />
          )}
          onView={(item) => setViewItem(item)} // Trigger view dialog
          onDelete={async (id) => {
            await deleteMutation.mutateAsync(id)
          }}
          isDeleting={deleteMutation.isPending}
          getItemDisplayName={(item) =>
            `leave scheduled for ${new Date(item.leave_date).toLocaleDateString()}`
          }
        />
      </div>

      {/* View Item Dialog */}
      <Dialog
        open={!!viewItem}
        onOpenChange={(open) => !open && setViewItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4 pt-4 text-sm">
              <div className="grid grid-cols-[100px_1fr] items-start gap-2">
                <span className="font-semibold text-muted-foreground">
                  Date:
                </span>
                <span>
                  {new Date(viewItem.leave_date).toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-start gap-2">
                <span className="font-semibold text-muted-foreground">
                  Filed On:
                </span>
                <span>
                  {new Date(viewItem.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-start gap-2">
                <span className="font-semibold text-muted-foreground">
                  Reason:
                </span>
                <span className="whitespace-pre-wrap">{viewItem.reason}</span>
              </div>

              <div className="flex flex-col gap-2 border-t pt-2">
                <span className="font-semibold text-muted-foreground">
                  Approval Pipeline:
                </span>
                <div className="flex flex-col gap-3">
                  {viewItem.approval_logs?.length ? (
                    viewItem.approval_logs.map((alog: any, idx: number) => {
                      const emp = Array.isArray(alog.approver)
                        ? alog.approver[0]
                        : alog.approver
                      const name = emp
                        ? `${emp.first_name} ${emp.last_name}`
                        : "Unknown"

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between border-l-2 border-primary pl-3"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                              Step {alog.step_level}
                            </span>
                            <span className="font-medium">{name}</span>
                          </div>
                          <div>
                            {alog.status === "approved" ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                                Approved
                              </Badge>
                            ) : alog.status === "rejected" ? (
                              <Badge variant="destructive">Rejected</Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-amber-500/30 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                              >
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      No approvers assigned to this request.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
