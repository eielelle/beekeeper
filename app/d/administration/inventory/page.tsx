"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, MoreHorizontal, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/app-table"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Separator } from "@/components/ui/separator"

// ⚖️ Units of Measure Query & Types
import {
  fetchSkuUoms,
  deleteSkuUom,
  SkuUomStoreType,
} from "@/forms/queries/sku_uom.query"

// 🏷️ SKU Categories Query & Types
import {
  fetchSkuCategories,
  deleteSkuCategory,
  SkuCategoryStoreType,
} from "@/forms/queries/sku_category.query"

// Dropdown UI components from shadcn
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Page() {
  const queryClient = useQueryClient()

  // --- ⚖️ Units of Measure Table State ---
  const [uomSorting, setUomSorting] = React.useState<SortingState>([])
  const [uomGlobalFilter, setUomGlobalFilter] = React.useState("")
  const uomDeferredFilter = React.useDeferredValue(uomGlobalFilter)
  const [uomPagination, setUomPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })

  // --- 🏷️ SKU Categories Table State ---
  const [categorySorting, setCategorySorting] = React.useState<SortingState>([])
  const [categoryGlobalFilter, setCategoryGlobalFilter] = React.useState("")
  const categoryDeferredFilter = React.useDeferredValue(categoryGlobalFilter)
  const [categoryPagination, setCategoryPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 5,
    })

  // --- React Query Server-Side Fetchers ---
  const { data: uomData } = useQuery({
    queryKey: [
      "sku_uoms",
      uomPagination.pageIndex,
      uomPagination.pageSize,
      uomSorting,
      uomDeferredFilter,
    ],
    queryFn: () =>
      fetchSkuUoms({
        pageIndex: uomPagination.pageIndex,
        pageSize: uomPagination.pageSize,
        globalFilter: uomDeferredFilter,
        sorting: uomSorting,
      }),
  })

  const { data: categoryData } = useQuery({
    queryKey: [
      "sku_categories",
      categoryPagination.pageIndex,
      categoryPagination.pageSize,
      categorySorting,
      categoryDeferredFilter,
    ],
    queryFn: () =>
      fetchSkuCategories({
        pageIndex: categoryPagination.pageIndex,
        pageSize: categoryPagination.pageSize,
        globalFilter: categoryDeferredFilter,
        sorting: categorySorting,
      }),
  })

  // --- React Query Mutations ---
  const deleteUomMutation = useMutation({
    mutationFn: deleteSkuUom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sku_uoms"] })
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteSkuCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sku_categories"] })
    },
  })

  // --- Columns Configuration ---
  const uomColumns: ColumnDef<SkuUomStoreType>[] = [
    { accessorKey: "id", header: "ID", enableSorting: false },
    { accessorKey: "uom", header: "Unit of Measure" },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) =>
        new Date(row.original.created_at || "").toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(item.id || "")}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/d/administration/sku/uoms/edit/${item.id}`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit UOM
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="focus:text-destructive-foreground text-destructive focus:bg-destructive"
                onClick={() => {
                  if (confirm(`Delete unit of measure: ${item.uom}?`)) {
                    deleteUomMutation.mutate(item.id || "")
                  }
                }}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const categoryColumns: ColumnDef<SkuCategoryStoreType>[] = [
    { accessorKey: "id", header: "ID", enableSorting: false },
    { accessorKey: "category_name", header: "Category Name" },
    { accessorKey: "category_description", header: "Description" },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) =>
        new Date(row.original.created_at || "").toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const category = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(category.id || "")}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/d/administration/sku/categories/edit/${category.id}`}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Category
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="focus:text-destructive-foreground text-destructive focus:bg-destructive"
                onClick={() => {
                  if (
                    confirm(`Delete SKU category: ${category.category_name}?`)
                  ) {
                    deleteCategoryMutation.mutate(category.id || "")
                  }
                }}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* ⚖️ Units of Measure Section */}
      <section className="grid grid-cols-1 gap-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xs font-semibold">Units of Measure</h1>
            <p className="font-mono text-xs text-muted-foreground">
              Manage inventory metric expressions and standardized scales
            </p>
          </div>
          <Link href="/d/administration/inventory/sku-uom/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add UOM
            </Button>
          </Link>
        </header>

        <DataTable
          columns={uomColumns}
          data={uomData?.data ?? []}
          rowCount={uomData?.rowCount ?? 0}
          pageIndex={uomPagination.pageIndex}
          pageSize={uomPagination.pageSize}
          sorting={uomSorting}
          globalFilter={uomGlobalFilter}
          onPaginationChange={setUomPagination}
          onSortingChange={setUomSorting}
          onGlobalFilterChange={setUomGlobalFilter}
        />
      </section>

      <Separator />

      {/* 🏷️ SKU Categories Section */}
      <section className="grid grid-cols-1 gap-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xs font-semibold">SKU Categories</h1>
            <p className="text-xs text-muted-foreground">
              Classify and sort inventory items into ledger allocation groups
            </p>
          </div>
          <Link href="/d/administration/inventory/sku-category/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </Link>
        </header>

        <DataTable
          columns={categoryColumns}
          data={categoryData?.data ?? []}
          rowCount={categoryData?.rowCount ?? 0}
          pageIndex={categoryPagination.pageIndex}
          pageSize={categoryPagination.pageSize}
          sorting={categorySorting}
          globalFilter={categoryGlobalFilter}
          onPaginationChange={setCategoryPagination}
          onSortingChange={setCategorySorting}
          onGlobalFilterChange={setCategoryGlobalFilter}
        />
      </section>
    </div>
  )
}
