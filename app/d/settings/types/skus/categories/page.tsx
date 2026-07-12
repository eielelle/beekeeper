"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/table"
import {
  deleteSkuCategory,
  fetchSkuCategories,
  SkuCategoryStoreType,
} from "@/forms/queries/sku_category.query"
import { SkuCategoryForm } from "@/forms/sku_category.form"

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
      "sku_categories",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
    ],
    queryFn: () =>
      fetchSkuCategories({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
      }),
  })

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteSkuCategory(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sku_categories"] })
    },
  })

  // --- Table Columns ---
  const columns = React.useMemo<ColumnDef<SkuCategoryStoreType>[]>(
    () => [
      {
        accessorKey: "category_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "category_name",
                  desc:
                    sorting[0]?.id === "category_name"
                      ? !sorting[0].desc
                      : false,
                },
              ])
            }
          >
            Category Name
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("category_name")}</span>
        ),
      },
      {
        accessorKey: "category_description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.getValue("category_description") || "—"}
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
      title="SKU Categories"
      description="All your product SKU categories"
      entityName="SKU Category"
      columns={columns}
      data={data?.data ?? []}
      rowCount={data?.rowCount ?? 0}
      isLoading={isLoading}
      searchPlaceholder="Search categories..."
      globalFilter={globalFilter}
      onSearchChange={setGlobalFilter}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      renderForm={({ id, onClose }) => (
        <SkuCategoryForm editId={id?.toString()} onClose={onClose} />
      )}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id)
      }}
      isDeleting={deleteMutation.isPending}
      getItemDisplayName={(item) => item.category_name}
    />
  )
}
