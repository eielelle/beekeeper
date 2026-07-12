"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/custom/data-table/table"
import {
  deleteOutlet,
  fetchOutlets,
  OutletStoreType,
} from "@/forms/queries/outlet.query"
import { OutletForm } from "@/forms/outlet.form"

export default function Page() {
  const queryClient = useQueryClient()

  // --- Table Control States ---
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])

  // --- Supabase Query ---
  const { data, isLoading } = useQuery({
    queryKey: [
      "outlets",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
    ],
    queryFn: () =>
      fetchOutlets({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
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
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.getValue("outlet_name")}</span>
          </div>
        ),
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
        <OutletForm editId={id?.toString()} onClose={onClose} />
      )}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id)
      }}
      isDeleting={deleteMutation.isPending}
      getItemDisplayName={(item) => `${item.outlet_code} (${item.outlet_name})`}
    />
  )
}
