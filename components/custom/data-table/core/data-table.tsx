"use client"

import * as React from "react"
import {
  type ColumnDef,
  type RowData,
  type PaginationState,
  type Row,
  type Column,
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ArrowDownToLine, ArrowUpToLine, PinOff } from "lucide-react"

import {
  features,
  useAppTable,
  type DataTableFeatures,
} from "@/hooks/use-data-table"
import DataTablePagination from "./data-table-pagination"
import { useUrlTableState } from "@/hooks/use-url-table-state"
import { DataTableViewOptions } from "./data-table-column-visibility"
import { DataTableSortList } from "./data-table-sort-list"
import { cn } from "@/lib/utils"
import { DataTableSearch } from "./data-table-search"
import { DataTableGlobalSearch } from "./data-table-global-search"
import { Input } from "@/components/ui/input"
import { NumberRangeFilter } from "../filters/value-range-filter"
import { DateRangeFilter } from "../filters/date-range-filter"
import { CheckboxFilter } from "../filters/checkbox-multi-select-filter"
import { DateFilter } from "../filters/single-date-filter"
import { CustomColumnMeta } from "@/types/filter-payloads"

interface DataTableProps<TData extends RowData> {
  tkey: string
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  paginationAtom?: Atom<PaginationState>
  pageCount: number
  rowCount: number
}

export function DataTable<TData extends RowData>({
  tkey,
  columns,
  data,
  pageCount = -1,
  rowCount,
}: DataTableProps<TData>) {
  const {
    pagination,
    rowPinning,
    columnPinning,
    columnOrder,
    columnFilters,
    setRowPinning,
    setColumnPinning,
    setColumnOrder,
    setColumnFilters,
  } = useUrlTableState()

  const table = useAppTable({
    key: tkey,
    data,
    columns,
    rowCount,
    pageCount,

    state: {
      pagination,
      rowPinning,
      columnPinning,
      columnOrder,
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    onRowPinningChange: setRowPinning,
    onColumnPinningChange: setColumnPinning,
    onColumnOrderChange: setColumnOrder,
  })

  // --- Drag and Drop State ---
  const [draggedColumn, setDraggedColumn] = React.useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(
    null
  )

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedColumn(id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (dragOverColumn !== id) setDragOverColumn(id)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedColumn || draggedColumn === targetId) return

    const currentOrder = table.getAllLeafColumns().map((c) => c.id)

    const draggedIndex = currentOrder.indexOf(draggedColumn)
    const targetIndex = currentOrder.indexOf(targetId)

    const newOrder = [...currentOrder]
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedColumn)

    table.setColumnOrder(newOrder)
    setDraggedColumn(null)
  }

  // --- Helper: Calculate sticky styles for pinned columns ---
  const getStickyStyles = (
    column: Column<typeof features, TData, unknown>
  ): React.CSSProperties => {
    const isPinned = column.getIsPinned()
    if (!isPinned) return {}

    return {
      position: "sticky",
      backgroundColor: "var(--background)",
      zIndex: 20,
      left: isPinned === "start" ? `${column.getStart()}px` : undefined,
      right: isPinned === "end" ? `${column.getAfter()}px` : undefined,
    }
  }

  // --- Helper Component: Wraps TableRow with Right-Click Context Menu ---
  const ContextMenuRow = ({
    row,
    className,
  }: {
    row: Row<typeof features, TData>
    className?: string
  }) => {
    const isPinned = row.getIsPinned()

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <TableRow
            data-state={row.getIsSelected() && "selected"}
            className={className}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                style={{
                  width: cell.column.getSize(),
                  ...getStickyStyles(
                    cell.column as Column<typeof features, TData, unknown>
                  ),
                }}
                className={cn(
                  cell.column.getIsPinned() ? "border-x bg-background" : ""
                )}
              >
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          {isPinned !== "top" && (
            <ContextMenuItem onClick={() => row.pin("top")}>
              <ArrowUpToLine className="mr-2 h-4 w-4" /> Pin to Top
            </ContextMenuItem>
          )}
          {isPinned !== "bottom" && (
            <ContextMenuItem onClick={() => row.pin("bottom")}>
              <ArrowDownToLine className="mr-2 h-4 w-4" /> Pin to Bottom
            </ContextMenuItem>
          )}
          {isPinned && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => row.pin(false)}>
                <PinOff className="mr-2 h-4 w-4" /> Unpin Row
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return (
    <div className="space-y-4">
      {/* <DataTableSearch searchableColumns={[{ id: "name", title: "Name" }]} /> */}

      <div className="flex items-center justify-between gap-4">
        <DataTableGlobalSearch />

        <div className="flex items-center gap-2">
          <DataTableSortList table={table} />
          <DataTableViewOptions table={table} />
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        {/* Let the table fill 100% width, dividing columns equally by default */}
        <Table
          className="w-full"
          style={{ minWidth: table.getTotalSize(), tableLayout: "fixed" }}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as CustomColumnMeta
                  const filterVariant = meta?.filterVariant
                  const filterOptions = meta?.filterOptions ?? []

                  return (
                    <TableHead
                      key={header.id}

                      // --- Drag and Drop Events ---
                      draggable={!header.column.getIsPinned()}
                      onDragStart={(e) => handleDragStart(e, header.column.id)}
                      onDragOver={(e) => handleDragOver(e, header.column.id)}
                      onDrop={(e) => handleDrop(e, header.column.id)}
                      onDragLeave={() => setDragOverColumn(null)}
                      onDragEnd={() => {
                        setDraggedColumn(null)
                        setDragOverColumn(null)
                      }}

                      style={{
                        width: header.column.getSize(),
                        ...getStickyStyles(
                          header.column as Column<
                            typeof features,
                            TData,
                            unknown
                          >
                        ),
                      }}
                      className={cn(
                        "group relative transition-colors duration-200",
                        header.column.getIsPinned() ? "border-x shadow-sm" : "",
                        draggedColumn === header.column.id
                          ? "bg-accent opacity-40"
                          : "",
                        dragOverColumn === header.column.id
                          ? "border-l-4 border-l-primary bg-accent/50"
                          : ""
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex h-full w-full flex-col py-2">
                          <div className="flex-1 font-semibold">
                            <table.FlexRender header={header} />
                          </div>

                          {header.column.getCanFilter() ? (
                            <div className="mt-2 w-full">
                              {filterVariant === "number-range" ? (
                                <NumberRangeFilter column={header.column} />
                              ) : filterVariant === "date-range" ? (
                                <DateRangeFilter column={header.column} />
                              ) : filterVariant === "date" ? (
                                <DateFilter column={header.column} />
                              ) : filterVariant === "checkbox" ? (
                                <CheckboxFilter
                                  column={header.column}
                                  options={filterOptions}
                                />
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Column Resizer Handle */}
                      {header.column.getCanResize() && (
                        <div
                          onDoubleClick={() => header.column.resetSize()}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}

                          draggable
                          onDragStart={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}

                          className={cn(
                            "absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-border select-none",
                            header.column.getIsResizing()
                              ? "bg-primary opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          )}
                        />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {/* 1. TOP PINNED ROWS */}
            {table.getTopRows().map((row) => (
              <ContextMenuRow
                key={row.id}
                row={row}
                className="sticky top-0 z-10 bg-muted/50"
              />
            ))}

            {/* 2. CENTER (UNPINNED) ROWS */}
            {table.getCenterRows().length
              ? table
                  .getCenterRows()
                  .map((row) => <ContextMenuRow key={row.id} row={row} />)
              : table.getTopRows().length === 0 &&
                table.getBottomRows().length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}

            {/* 3. BOTTOM PINNED ROWS */}
            {table.getBottomRows().map((row) => (
              <ContextMenuRow
                key={row.id}
                row={row}
                className="sticky bottom-0 z-10 bg-muted/50"
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
