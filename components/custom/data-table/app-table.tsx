"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel, // Only this one stays for structural building!
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { ButtonGroup } from "@/components/ui/button-group"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  rowCount: number
  pageIndex: number
  pageSize: number
  sorting: SortingState
  globalFilter: string
  onPaginationChange: (updater: any) => void
  onSortingChange: (updater: any) => void
  onGlobalFilterChange: (value: string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  rowCount,
  pageIndex,
  pageSize,
  sorting,
  globalFilter,
  onPaginationChange,
  onSortingChange,
  onGlobalFilterChange,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    rowCount, // Tell the table the true total row count on server

    state: {
      sorting,
      globalFilter,
      pagination: { pageIndex, pageSize },
    },

    // Turn off client-side evaluation engines
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,

    // Bind state updates to parent component controls
    onPaginationChange,
    onSortingChange,
    onGlobalFilterChange,

    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="grid w-full grid-cols-1 gap-4 font-mono text-xs">
      {/* 🔍 Search */}
      <div className="">
        <Input
          placeholder="Search organization names..."
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* 📊 Table */}
      <div className="border">
        <Table className="font-mono text-xs">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort()
                  return (
                    <TableHead
                      key={header.id}
                      onClick={
                        isSortable
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      className={isSortable ? "cursor-pointer select-none" : ""}
                    >
                      {/* Using inline-flex keeps the container exactly as wide as the text + icon combined */}
                      <div className="inline-flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}

                        <span className="shrink-0">
                          {{
                            asc: <ChevronUp className="h-4 w-4" />,
                            desc: <ChevronDown className="h-4 w-4" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </span>
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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

      {/* 📄 Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>

        <ButtonGroup>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </ButtonGroup>
      </div>
    </div>
  )
}
