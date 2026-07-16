"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/custom/data-table/table"
import {
  deleteBadOrder,
  fetchBadOrders,
  BadOrderStoreType,
} from "@/forms/queries/bad_order.query"
import { BadOrderForm } from "@/forms/bad_order.form"

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
      "bad_orders",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
    ],
    queryFn: () =>
      fetchBadOrders({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteBadOrder(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bad_orders"] })
    },
  })

  const columns = React.useMemo<ColumnDef<BadOrderStoreType>[]>(
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
        accessorKey: "type",
        header: "Order Type",
        cell: ({ row }) => {
          const type = row.getValue("type") as string
          return (
            <Badge
              variant={type === "for_disposal" ? "destructive" : "secondary"}
            >
              {type === "for_disposal" ? "For Disposal" : "Return to WH"}
            </Badge>
          )
        },
      },
      {
        id: "items_count",
        header: "Total Items",
        cell: ({ row }) => {
          const count = row.original.bad_orders_items?.length || 0
          return (
            <div className="flex items-center text-sm font-medium">
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
              {count} SKU(s)
            </div>
          )
        },
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => {
          const val = row.getValue("notes") as string
          return (
            <span className="block max-w-[200px] truncate text-muted-foreground">
              {val || "—"}
            </span>
          )
        },
      },
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
                    sorting[0]?.id === "created_at" ? !sorting[0].desc : false,
                },
              ])
            }
          >
            Date Logged
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const raw = row.getValue("created_at") as string
          return raw ? new Date(raw).toLocaleDateString() : "—"
        },
      },
    ],
    [sorting]
  )

  return (
    <DataTable
      title="Bad Orders"
      description="Manage damaged, expired, or returned SKUs from outlets."
      entityName="Bad Order"
      columns={columns}
      data={data?.data ?? []}
      rowCount={data?.rowCount ?? 0}
      isLoading={isLoading}
      searchPlaceholder="Search notes or types..."
      globalFilter={globalFilter}
      onSearchChange={setGlobalFilter}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      renderForm={({ id, onClose }) => (
        <div className="max-h-[80vh] overflow-y-auto pr-1">
          <BadOrderForm editId={id?.toString()} onClose={onClose} />
        </div>
      )}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id)
      }}
      isDeleting={deleteMutation.isPending}
      getItemDisplayName={(item) => {
        const outlet = getFirstItem(item.outlets)
        return outlet
          ? `Bad Order for ${outlet.outlet_name}`
          : "Bad Order Entry"
      }}
    />
  )
}
