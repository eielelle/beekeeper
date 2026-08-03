"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table"
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  LayoutGrid,
  KanbanSquare,
  List as ListIcon,
  Download,
  Settings2,
  EyeOff,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Import Custom Filters & Sorters
import {
  DynamicFilter,
  FilterField,
} from "@/components/custom/filter/dynamic-filter"
import {
  DynamicSorter,
  SortOption,
} from "@/components/custom/sort/dynamic-sorter"

interface DataTableProps<TData, TValue> {
  title?: string
  description?: string
  entityName?: string
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  rowCount: number
  isLoading?: boolean
  searchPlaceholder?: string
  globalFilter?: string
  onSearchChange?: (value: string) => void
  pagination: PaginationState
  onPaginationChange: (updater: Updater<PaginationState>) => void
  sorting: SortingState
  onSortingChange: (updater: Updater<SortingState>) => void

  // --- Optional Filter & Sorter Props ---
  sortOptions?: SortOption[]
  filterFields?: FilterField[]
  filterValues?: Record<string, string>
  onFilterChange?: (values: Record<string, string>) => void
  onFilterClear?: () => void

  renderForm?: (props: {
    id?: string | number
    onClose: () => void
  }) => React.ReactNode
  onDelete?: (id: string | number) => Promise<void>
  isDeleting?: boolean
  getItemDisplayName?: (item: TData) => string
}

export function DataTable<TData, TValue>({
  title,
  description, // Keeping it available but hidden in this compact layout
  entityName = "Item",
  columns,
  data,
  rowCount,
  isLoading,
  searchPlaceholder = "Search...",
  globalFilter,
  onSearchChange,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  sortOptions,
  filterFields,
  filterValues,
  onFilterChange,
  onFilterClear,
  renderForm,
  onDelete,
  isDeleting,
  getItemDisplayName,
}: DataTableProps<TData, TValue>) {
  // --- Form & Action State ---
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editId, setEditId] = React.useState<string | number | undefined>()
  const [itemToDelete, setItemToDelete] = React.useState<TData | null>(null)

  const openAdd = () => {
    setEditId(undefined)
    setIsFormOpen(true)
  }

  const openEdit = (id: string | number) => {
    setEditId(id)
    setIsFormOpen(true)
  }

  // --- Auto-Inject Actions Column if needed ---
  const tableColumns = React.useMemo(() => {
    const baseCols = [...columns]
    if (renderForm || onDelete) {
      baseCols.push({
        id: "actions",
        header: () => (
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Actions
          </span>
        ),
        cell: ({ row }) => {
          const recordId = (row.original as unknown as { id: string | number })
            .id

          return (
            <div className="flex items-center justify-start gap-2">
              {renderForm && (
                <Button
                  variant="outline"
                  size="xs"
                  className="px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => openEdit(recordId)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="xs"
                  className="px-2.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setItemToDelete(row.original)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              )}
            </div>
          )
        },
      } as ColumnDef<TData, TValue>)
    }
    return baseCols
  }, [columns, renderForm, onDelete])

  // --- Initialize Table ---
  const table = useReactTable({
    data,
    columns: tableColumns,
    pageCount: Math.ceil(rowCount / pagination.pageSize),
    state: {
      pagination,
      sorting,
    },
    onPaginationChange,
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  const pageSize = pagination.pageSize
  const updatePage = (newPageIndex: number) => {
    onPaginationChange({ pageIndex: newPageIndex, pageSize })
  }

  const totalPages = table.getPageCount()
  const currentSortValue =
    sorting.length > 0 ? `${sorting[0]?.id}-${sorting[0]?.desc}` : ""

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* --- Top Navigation Toolbar --- */}
        <div className="flex flex-col items-start justify-between gap-4 border-b px-4 py-3 sm:flex-row sm:items-center">
          {/* Right: Actions */}
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
            {onSearchChange && (
              <div className="relative w-full shrink-0 sm:w-56">
                <Search className="absolute top-1.5 left-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={globalFilter || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-7 bg-background pl-9 text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {sortOptions && sortOptions.length > 0 && (
              <DynamicSorter
                options={sortOptions}
                value={currentSortValue}
                onValueChange={(val) => {
                  const [id, descStr] = val.split("-")
                  onSortingChange([{ id, desc: descStr === "true" }])
                }}
                className="h-1 w-full bg-white text-xs sm:w-[200px] dark:bg-zinc-950"
              />
            )}
            {renderForm && <Button onClick={openAdd}>Add {entityName}</Button>}
          </div>
        </div>

        {/* --- Second Toolbar: Filters & Sorters --- */}
        {(filterFields || sortOptions) && (
          <div className="flex flex-col items-center gap-3 border-b bg-gray-50/30 px-5 py-2.5 sm:flex-row dark:bg-zinc-900/30">
            {filterFields && filterFields.length > 0 && (
              <div className="w-full sm:w-auto">
                <DynamicFilter
                  title={`Filter ${entityName}s`}
                  description="Narrow down the results."
                  fields={filterFields}
                  values={filterValues || {}}
                  onApply={(vals) => onFilterChange?.(vals)}
                  onClear={() => onFilterClear?.()}
                />
              </div>
            )}
          </div>
        )}

        {/* --- Data Table --- */}
        <div className="relative w-full flex-1 overflow-auto">
          <Table className="w-full caption-bottom text-xs">
            <TableHeader className="sticky top-0 z-10 bg-gray-50 shadow-sm backdrop-blur dark:bg-zinc-900/80">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b-0">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-4 px-5 py-0 text-left align-middle text-xs font-semibold text-gray-700 dark:text-gray-300"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow
                    key={i}
                    className="h-2 border-b border-gray-100 dark:border-zinc-800"
                  >
                    <TableCell colSpan={tableColumns.length} className="px-5">
                      <Skeleton className="h-6 w-full bg-gray-100 dark:bg-zinc-800" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="h-4 border-b border-gray-100 transition-colors hover:bg-gray-50/50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-5 align-middle">
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
                    colSpan={tableColumns.length}
                    className="h-32 text-center text-sm text-muted-foreground"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* --- Bottom Pagination Footer --- */}
        <div className="flex flex-col items-center justify-between border-t border-gray-200 bg-white px-5 py-3 text-sm sm:flex-row dark:border-zinc-800 dark:bg-zinc-950">
          {/* Left: Rows Info & Limit Selector */}
          <div className="flex w-full items-center justify-center gap-3 sm:w-auto sm:justify-start">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) =>
                onPaginationChange({ pageIndex: 0, pageSize: Number(val) })
              }
            >
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-2 text-xs text-muted-foreground">
              {data.length ? pagination.pageIndex * pageSize + 1 : 0}-
              {Math.min((pagination.pageIndex + 1) * pageSize, rowCount)} of{" "}
              {rowCount} rows
            </span>
          </div>

          {/* Right: Pagination Controls */}
          <div className="mt-4 flex items-center gap-1 sm:mt-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => updatePage(0)}
              disabled={pagination.pageIndex === 0 || isLoading}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => updatePage(Math.max(0, pagination.pageIndex - 1))}
              disabled={pagination.pageIndex === 0 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Dynamic Page Numbers (simplified representation) */}
            <div className="flex items-center gap-1 px-2 text-xs font-medium">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-foreground dark:bg-zinc-800">
                {pagination.pageIndex + 1}
              </span>
              <span className="px-1 text-muted-foreground">/</span>
              <span className="text-muted-foreground">{totalPages || 1}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => updatePage(pagination.pageIndex + 1)}
              disabled={pagination.pageIndex >= totalPages - 1 || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => updatePage(Math.max(0, totalPages - 1))}
              disabled={pagination.pageIndex >= totalPages - 1 || isLoading}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* --- Add / Edit Form Dialog --- */}
      {renderForm && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="flex flex-col gap-0 overflow-hidden border-0 p-0 sm:max-w-md">
            <DialogHeader className="p-4">
              <DialogTitle>
                {editId ? `Edit ${entityName}` : `Add ${entityName}`}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[75vh] overflow-y-auto p-4">
              {isFormOpen &&
                renderForm({ id: editId, onClose: () => setIsFormOpen(false) })}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* --- Delete Confirmation Dialog --- */}
      {onDelete && (
        <AlertDialog
          open={!!itemToDelete}
          onOpenChange={(open) => {
            if (!open) setItemToDelete(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {entityName}</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                {getItemDisplayName && itemToDelete ? (
                  <strong>{getItemDisplayName(itemToDelete)}</strong>
                ) : (
                  `this ${entityName.toLowerCase()}`
                )}
                ? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                disabled={isDeleting}
                onClick={async (e) => {
                  e.preventDefault()
                  if (itemToDelete) {
                    const recordId = (
                      itemToDelete as unknown as { id: string | number }
                    ).id
                    await onDelete(recordId)
                    setItemToDelete(null)
                  }
                }}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
