"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown, CalendarDays, Clock, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/custom/data-table/table"
import {
  deleteVisit,
  fetchVisits,
  VisitStoreType,
} from "@/forms/queries/visit.query"
import { VisitForm } from "@/forms/visit.form"

const getFirstItem = (data: any) => (Array.isArray(data) ? data[0] : data)

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
      "visits",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
    ],
    queryFn: () =>
      fetchVisits({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteVisit(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] })
    },
  })

  const columns = React.useMemo<ColumnDef<VisitStoreType>[]>(
    () => [
      {
        accessorKey: "outlets.outlet_name",
        id: "outlet_name",
        header: "Outlet",
        cell: ({ row }) => {
          const outlet = getFirstItem(row.original.outlets)
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-primary">
                {outlet?.outlet_name || "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                {outlet?.outlet_code}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "visit_types.type_name",
        id: "type_name",
        header: "Visit Type",
        cell: ({ row }) => {
          const type = getFirstItem(row.original.visit_types)
          return <Badge variant="secondary">{type?.type_name || "—"}</Badge>
        },
      },
      {
        accessorKey: "start_date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "start_date",
                  desc:
                    sorting[0]?.id === "start_date" ? !sorting[0].desc : false,
                },
              ])
            }
          >
            Date Range
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const start = new Date(
            row.getValue("start_date")
          ).toLocaleDateString()
          const end = new Date(row.original.end_date).toLocaleDateString()
          return (
            <div className="flex items-center text-sm">
              <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
              {start === end ? start : `${start} to ${end}`}
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
              {sTime || "?"} - {eTime || "?"}
            </div>
          )
        },
      },
      {
        accessorKey: "repeats_every",
        header: "Recurrence",
        cell: ({ row }) => {
          const repeat = row.original.repeats_every
          if (!repeat || repeat === "none") return "—"
          return (
            <div className="flex items-center text-sm capitalize">
              <RefreshCw className="mr-2 h-3.5 w-3.5 text-blue-500" />
              Every {repeat}
            </div>
          )
        },
      },
    ],
    [sorting]
  )

  return (
    <DataTable
      title="Scheduled Visits"
      description="Manage routing, itineraries, and recurring outlet visits."
      entityName="Visit"
      columns={columns}
      data={data?.data ?? []}
      rowCount={data?.rowCount ?? 0}
      isLoading={isLoading}
      searchPlaceholder="Search notes..."
      globalFilter={globalFilter}
      onSearchChange={setGlobalFilter}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      renderForm={({ id, onClose }) => (
        <div className="max-h-[80vh] overflow-y-auto pr-1">
          <VisitForm editId={id?.toString()} onClose={onClose} />
        </div>
      )}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id)
      }}
      isDeleting={deleteMutation.isPending}
      getItemDisplayName={(item) => {
        const outlet = getFirstItem(item.outlets)
        return outlet ? `Visit to ${outlet.outlet_name}` : `Visit Record`
      }}
    />
  )
}
