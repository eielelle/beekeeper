"use client"

import {
  type ColumnDef,
  type RowData,
  type PaginationState,
} from "@tanstack/react-table"
import type { Atom } from "@tanstack/react-store"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAppTable, type DataTableFeatures } from "@/hooks/use-data-table"
// Optional: Keep this if you plan to use your custom pagination component
import DataTablePagination from "./data-table-pagination"
import { useUrlTableState } from "@/hooks/use-url-table-state"
import { DataTableViewOptions } from "./data-table-column-visibility"

interface DataTableProps<TData extends RowData> {
  tkey: string
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  paginationAtom?: Atom<PaginationState> // Accepts the atom from page.tsx
  pageCount?: number
  rowCount?: number
}

export function DataTable<TData extends RowData>({
  tkey,
  columns,
  data,
  pageCount = -1,
  rowCount,
}: DataTableProps<TData>) {
  const { pagination } = useUrlTableState()

  const table = useAppTable({
    key: tkey,
    data,
    columns,
    rowCount,
    pageCount,

    state: { pagination },
  })

  return (
    <div className="space-y-4">
      <p>fkfkbfkd</p>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      <DataTableViewOptions table={table} />
    </div>
  )
}
