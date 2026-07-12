"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/table"
import {
  deleteProductionArea,
  fetchProductionAreas,
  ProductionAreaStoreType,
} from "@/forms/queries/production_area.query"
import { ProductionAreaForm } from "@/forms/production_area.form"

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
      "production_areas",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
    ],
    queryFn: () =>
      fetchProductionAreas({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
      }),
  })

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteProductionArea(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production_areas"] })
    },
  })

  // --- Table Columns ---
  const columns = React.useMemo<ColumnDef<ProductionAreaStoreType>[]>(
    () => [
      {
        accessorKey: "area_code",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "area_code",
                  desc:
                    sorting[0]?.id === "area_code" ? !sorting[0].desc : false,
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
            {row.getValue("area_code")}
          </span>
        ),
      },
      {
        accessorKey: "area_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "area_name",
                  desc:
                    sorting[0]?.id === "area_name" ? !sorting[0].desc : false,
                },
              ])
            }
          >
            Area Name
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("area_name")}</span>
        ),
      },
      {
        accessorKey: "area_description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.getValue("area_description") || "—"}
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
      title="Production Areas"
      description="All your facility production areas"
      entityName="Production Area"
      columns={columns}
      data={data?.data ?? []}
      rowCount={data?.rowCount ?? 0}
      isLoading={isLoading}
      searchPlaceholder="Search by code or name..."
      globalFilter={globalFilter}
      onSearchChange={setGlobalFilter}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      renderForm={({ id, onClose }) => (
        <ProductionAreaForm editId={id?.toString()} onClose={onClose} />
      )}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id)
      }}
      isDeleting={deleteMutation.isPending}
      getItemDisplayName={(item) => `${item.area_code} (${item.area_name})`}
    />
  )
}
