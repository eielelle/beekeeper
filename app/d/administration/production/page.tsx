"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, MoreHorizontal, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/app-table"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// 🏙️ Production Areas Query & Types
import {
  fetchProductionAreas,
  deleteProductionArea,
  ProductionAreaStoreType,
} from "@/forms/queries/production_area.query"

// ⚙️ Production Lines Query & Types
import {
  fetchProductionLines,
  deleteProductionLine,
  ProductionLineStoreType,
} from "@/forms/queries/production_line.query"

// Dropdown UI components from shadcn
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

export default function Page() {
  const queryClient = useQueryClient()

  // --- Production Areas Table State ---
  const [areaSorting, setAreaSorting] = React.useState<SortingState>([])
  const [areaGlobalFilter, setAreaGlobalFilter] = React.useState("")
  const areaDeferredFilter = React.useDeferredValue(areaGlobalFilter)
  const [areaPagination, setAreaPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })

  // --- Production Lines Table State ---
  const [lineSorting, setLineSorting] = React.useState<SortingState>([])
  const [lineGlobalFilter, setLineGlobalFilter] = React.useState("")
  const lineDeferredFilter = React.useDeferredValue(lineGlobalFilter)
  const [linePagination, setLinePagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })

  // --- React Query Server-Side Fetchers ---
  const { data: areaData } = useQuery({
    queryKey: [
      "production_areas",
      areaPagination.pageIndex,
      areaPagination.pageSize,
      areaSorting,
      areaDeferredFilter,
    ],
    queryFn: () =>
      fetchProductionAreas({
        pageIndex: areaPagination.pageIndex,
        pageSize: areaPagination.pageSize,
        globalFilter: areaDeferredFilter,
        sorting: areaSorting,
      }),
  })

  const { data: lineData } = useQuery({
    queryKey: [
      "production_lines",
      linePagination.pageIndex,
      linePagination.pageSize,
      lineSorting,
      lineDeferredFilter,
    ],
    queryFn: () =>
      fetchProductionLines({
        pageIndex: linePagination.pageIndex,
        pageSize: linePagination.pageSize,
        globalFilter: lineDeferredFilter,
        sorting: lineSorting,
      }),
  })

  // --- React Query Mutations ---
  const deleteAreaMutation = useMutation({
    mutationFn: deleteProductionArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production_areas"] })
    },
  })

  const deleteLineMutation = useMutation({
    mutationFn: deleteProductionLine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production_lines"] })
    },
  })

  // --- Columns Configuration ---
  const areaColumns: ColumnDef<ProductionAreaStoreType>[] = [
    { accessorKey: "id", header: "ID", enableSorting: false },
    { accessorKey: "area_name", header: "Area Name" },
    { accessorKey: "area_code", header: "Area Code" },
    { accessorKey: "created_at", header: "Created At" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const area = row.original
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
                onClick={() => navigator.clipboard.writeText(area.id || "")}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/d/administration/production/areas/edit/${area.id}`}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Area
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="focus:text-destructive-foreground text-destructive focus:bg-destructive"
                onClick={() => {
                  if (confirm(`Delete production area: ${area.area_name}?`)) {
                    deleteAreaMutation.mutate(area.id || "")
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

  const lineColumns: ColumnDef<ProductionLineStoreType>[] = [
    { accessorKey: "id", header: "ID", enableSorting: false },
    { accessorKey: "line_code", header: "Line Code" },
    { accessorKey: "line_name", header: "Line Name" },
    { accessorKey: "line_description", header: "Description" }, // Mapped to line_description
    { accessorKey: "created_at", header: "Created At" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const line = row.original
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
                onClick={() => navigator.clipboard.writeText(line.id || "")}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/d/administration/production/lines/edit/${line.id}`}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Line
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="focus:text-destructive-foreground text-destructive focus:bg-destructive"
                onClick={() => {
                  if (confirm(`Delete production line: ${line.line_name}?`)) {
                    deleteLineMutation.mutate(line.id || "")
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
      {/* 🏙️ Production Areas Section */}
      <section className="grid grid-cols-1 gap-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-sm font-semibold">Production Areas</h1>
            <p className="text-sm text-muted-foreground">
              Manage production areas
            </p>
          </div>
          <Link href="/d/administration/production/areas/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add Area
            </Button>
          </Link>
        </header>

        <DataTable
          columns={areaColumns}
          data={areaData?.data ?? []}
          rowCount={areaData?.rowCount ?? 0}
          pageIndex={areaPagination.pageIndex}
          pageSize={areaPagination.pageSize}
          sorting={areaSorting}
          globalFilter={areaGlobalFilter}
          onPaginationChange={setAreaPagination}
          onSortingChange={setAreaSorting}
          onGlobalFilterChange={setAreaGlobalFilter}
        />
      </section>

      <Separator />

      {/* ⚙️ Production Lines Section */}
      <section className="grid grid-cols-1 gap-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-sm font-semibold">Production Lines</h1>
            <p className="text-sm text-muted-foreground">
              Monitor and configure output assembly lines
            </p>
          </div>
          <Link href="/d/administration/production/lines/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add Line
            </Button>
          </Link>
        </header>

        <DataTable
          columns={lineColumns}
          data={lineData?.data ?? []}
          rowCount={lineData?.rowCount ?? 0}
          pageIndex={linePagination.pageIndex}
          pageSize={linePagination.pageSize}
          sorting={lineSorting}
          globalFilter={lineGlobalFilter}
          onPaginationChange={setLinePagination}
          onSortingChange={setLineSorting}
          onGlobalFilterChange={setLineGlobalFilter}
        />
      </section>
    </div>
  )
}
