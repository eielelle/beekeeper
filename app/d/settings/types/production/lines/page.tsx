"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/table"
import {
  deleteProductionLine,
  fetchProductionLines,
  ProductionLineStoreType,
} from "@/forms/queries/production_line.query"
import { ProductionLineForm } from "@/forms/production_line.form"

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
      "production_lines",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
    ],
    queryFn: () =>
      fetchProductionLines({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
      }),
  })

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteProductionLine(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production_lines"] })
    },
  })

  // --- Table Columns ---
  const columns = React.useMemo<ColumnDef<ProductionLineStoreType>[]>(
    () => [
      {
        accessorKey: "line_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "line_name",
                  desc:
                    sorting[0]?.id === "line_name" ? !sorting[0].desc : false,
                },
              ])
            }
          >
            Line Name
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("line_name")}</span>
        ),
      },
      {
        accessorKey: "line_description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.getValue("line_description") || "—"}
          </span>
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
      title="Production Lines"
      description="All your facility production lines"
      entityName="Production Line"
      columns={columns}
      data={data?.data ?? []}
      rowCount={data?.rowCount ?? 0}
      isLoading={isLoading}
      searchPlaceholder="Search lines..."
      globalFilter={globalFilter}
      onSearchChange={setGlobalFilter}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      renderForm={({ id, onClose }) => (
        <ProductionLineForm editId={id?.toString()} onClose={onClose} />
      )}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id)
      }}
      isDeleting={deleteMutation.isPending}
      getItemDisplayName={(item) => item.line_name}
    />
  )
}
