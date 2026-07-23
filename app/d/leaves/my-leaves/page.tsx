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

import { DataTable } from "@/components/custom/data-table/table"
import {
  DynamicFilter,
  FilterField,
} from "@/components/custom/filter/dynamic-filter"
import {
  deleteMyLeave,
  fetchMyLeaves,
  fetchMyLeaveStats,
  MyLeaveStoreType,
} from "@/forms/queries/my-leave.query"
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

export default function MyLeavesPage() {
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

  const columns = React.useMemo<ColumnDef<MyLeaveStoreType>[]>(
    () => [
      {
        accessorKey: "leave_date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "leave_date",
                  desc:
                    sorting[0]?.id === "leave_date" ? !sorting[0].desc : true,
                },
              ])
            }
          >
            Date
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const raw = row.getValue("leave_date") as string
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
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span
            className="block max-w-[350px] truncate text-muted-foreground"
            title={row.getValue("reason")}
          >
            {row.getValue("reason")}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Filed On",
        cell: ({ row }) => {
          const raw = row.getValue("created_at") as string
          return raw ? new Date(raw).toLocaleDateString() : "—"
        },
      },
    ],
    [sorting]
  )

  return (
    <div className="flex flex-col space-y-6">
      {/* Stats Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
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
              <div className="text-2xl font-bold text-blue-600">
                {statsData?.upcoming ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DynamicFilter
        title="Filter Leaves"
        description="Filter your past and upcoming leave requests by date."
        fields={filterFields}
        values={filterValues}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <DataTable
        title="My Leaves"
        description="File and manage your leave requests."
        entityName="Leave"
        columns={columns}
        data={data?.data ?? []}
        rowCount={data?.rowCount ?? 0}
        isLoading={isLoading}
        searchPlaceholder="Search by reason..."
        globalFilter={globalFilter}
        onSearchChange={setGlobalFilter}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        renderForm={({ id, onClose }) => (
          <div className="max-h-[80vh] overflow-y-auto pr-1">
            <MyLeaveForm editId={id?.toString()} onClose={onClose} />
          </div>
        )}
        onDelete={async (id) => {
          await deleteMutation.mutateAsync(id)
        }}
        isDeleting={deleteMutation.isPending}
        getItemDisplayName={(item) =>
          `leave scheduled for ${new Date(item.leave_date).toLocaleDateString()}`
        }
      />
    </div>
  )
}
