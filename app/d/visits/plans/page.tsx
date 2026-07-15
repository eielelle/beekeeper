"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown, CalendarDays, Clock, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/table"
import {
  deleteVisitPlan,
  fetchVisitPlans,
  VisitPlanStoreType,
} from "@/forms/queries/visit_plan.query"
import { VisitPlanForm } from "@/forms/visit_plan.form"

export default function Page() {
  const queryClient = useQueryClient()

  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])

  const { data, isLoading } = useQuery({
    queryKey: [
      "visit_plans",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
    ],
    queryFn: () =>
      fetchVisitPlans({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteVisitPlan(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visit_plans"] })
    },
  })

  const columns = React.useMemo<ColumnDef<VisitPlanStoreType>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "title",
                  desc: sorting[0]?.id === "title" ? !sorting[0].desc : false,
                },
              ])
            }
          >
            Plan Title
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-primary">
            {row.getValue("title")}
          </span>
        ),
      },
      {
        accessorKey: "start_date",
        header: "Schedule Window",
        cell: ({ row }) => {
          const start = new Date(
            row.getValue("start_date")
          ).toLocaleDateString()
          const end = new Date(row.original.end_date).toLocaleDateString()
          return (
            <div className="flex items-center text-sm">
              <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
              {start === end ? start : `${start} - ${end}`}
            </div>
          )
        },
      },
      {
        accessorKey: "start_time",
        header: "Time",
        cell: ({ row }) => {
          const sTime = row.original.start_time
          const eTime = row.original.end_time
          if (!sTime && !eTime)
            return <span className="text-muted-foreground">Anytime</span>
          return (
            <div className="flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              {sTime || "?"} to {eTime || "?"}
            </div>
          )
        },
      },
      {
        id: "items_count",
        header: "Attached Visits",
        cell: ({ row }) => {
          const itemsCount = row.original.visit_plan_items?.length || 0
          return (
            <div className="flex items-center text-sm">
              <MapPin className="mr-2 h-4 w-4 text-emerald-500" />
              <span className="font-medium">{itemsCount}</span> route(s)
            </div>
          )
        },
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => {
          const val = row.getValue("remarks") as string
          return (
            <span className="block max-w-[200px] truncate text-muted-foreground">
              {val || "—"}
            </span>
          )
        },
      },
    ],
    [sorting]
  )

  return (
    <DataTable
      title="Visit Plans & Itineraries"
      description="Group scheduled visits together into master route plans."
      entityName="Visit Plan"
      columns={columns}
      data={data?.data ?? []}
      rowCount={data?.rowCount ?? 0}
      isLoading={isLoading}
      searchPlaceholder="Search plans..."
      globalFilter={globalFilter}
      onSearchChange={setGlobalFilter}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      renderForm={({ id, onClose }) => (
        <div className="max-h-[80vh] overflow-y-auto pr-1">
          <VisitPlanForm editId={id?.toString()} onClose={onClose} />
        </div>
      )}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id)
      }}
      isDeleting={deleteMutation.isPending}
      getItemDisplayName={(item) => item.title}
    />
  )
}
