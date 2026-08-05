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
  Loader2,
  X,
  Eye, // Added Eye icon for the view action
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

  // --- Actions ---
  renderForm?: (props: {
    id?: string | number
    onClose: () => void
  }) => React.ReactNode
  onAdd?: () => void // Added onAdd action prop
  onView?: (item: TData) => void // Added onView action prop
  onDelete?: (id: string | number) => Promise<void>
  isDeleting?: boolean
  getItemDisplayName?: (item: TData) => string
}

// Helper for dynamic pagination numbers
const getPaginationItems = (currentPage: number, pageCount: number) => {
  const total = Math.max(1, pageCount)
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i)
  }
  if (currentPage <= 2) {
    return [0, 1, 2, "...", total - 2, total - 1]
  }
  if (currentPage >= total - 3) {
    return [0, "...", total - 3, total - 2, total - 1]
  }
  return [
    0,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    total - 1,
  ]
}

export function DataTable<TData, TValue>({
  title,
  description,
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
  onAdd, // Destructure onAdd
  onView, // Destructure onView
  onDelete,
  isDeleting,
  getItemDisplayName,
}: DataTableProps<TData, TValue>) {
  // --- Form & Action State ---
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editId, setEditId] = React.useState<string | number | undefined>()
  const [itemToDelete, setItemToDelete] = React.useState<TData | null>(null)

  const openAdd = () => {
    if (onAdd) {
      onAdd() // Call custom function if provided
    } else {
      setEditId(undefined)
      setIsFormOpen(true) // Otherwise open internal form dialog
    }
  }

  const openEdit = (id: string | number) => {
    setEditId(id)
    setIsFormOpen(true)
  }

  // --- Auto-Inject Actions Column if needed ---
  const tableColumns = React.useMemo(() => {
    const baseCols = [...columns]
    if (renderForm || onDelete || onView) {
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
            <div className="flex items-center justify-start gap-1.5">
              {onView && (
                <Button
                  variant="ghost"
                  size={"icon-xs"}
                  className="!h-6 !px-2 !py-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onView(row.original)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
              {renderForm && (
                <Button
                  variant="ghost"
                  size={"icon-xs"}
                  className="!h-6 !px-2 !py-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => openEdit(recordId)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size={"icon-xs"}
                  className="!h-6 !px-2 !py-0 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setItemToDelete(row.original)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )
        },
      } as ColumnDef<TData, TValue>)
    }
    return baseCols
  }, [columns, renderForm, onDelete, onView])

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

  const hasActiveFilters = filterValues && Object.keys(filterValues).length > 0
  const hasHeader = Boolean(title || description)
  const paginationItems = getPaginationItems(pagination.pageIndex, totalPages)

  return (
    <div className="flex h-full flex-col">
      {/* --- Header & Title --- */}
      {hasHeader && (
        <div className="flex flex-col items-start justify-between gap-2 border-b px-3 py-2 sm:flex-row sm:items-center">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {/* Changed: Show add button if either renderForm or onAdd is provided */}
          {(renderForm || onAdd) && (
            <Button className="!h-6 !px-2 !py-0 text-xs" onClick={openAdd}>
              Add {entityName}
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* --- Top Navigation Toolbar --- */}
        <div className="flex flex-col items-start justify-between gap-3 border-b px-3 py-2 sm:flex-row sm:items-center">
          {/* Left: Search */}
          <div className="flex w-full items-center gap-2 overflow-x-auto sm:w-auto">
            {onSearchChange && (
              <div className="relative w-full shrink-0 sm:w-56">
                <Search className="absolute top-1/2 left-1.5 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={globalFilter || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="!h-6 !min-h-0 bg-background !py-0 pl-6 text-xs"
                />
              </div>
            )}
          </div>

          {/* Right: Actions (Filter, Sort, Add) */}
          <div className="flex items-center gap-2">
            {filterFields && filterFields.length > 0 && (
              <DynamicFilter
                title={`Filter ${entityName}s`}
                description="Narrow down the results."
                fields={filterFields}
                values={filterValues || {}}
                onApply={(vals) => onFilterChange?.(vals)}
                onClear={() => onFilterClear?.()}
              />
            )}

            {sortOptions && sortOptions.length > 0 && (
              <DynamicSorter
                options={sortOptions}
                value={currentSortValue}
                onValueChange={(val) => {
                  const [id, descStr] = val.split("-")
                  onSortingChange([{ id, desc: descStr === "true" }])
                }}
                className="!h-6 w-full bg-white text-xs sm:w-[200px] dark:bg-zinc-950"
              />
            )}

            {/* Changed: Show add button if either renderForm or onAdd is provided */}
            {!hasHeader && (renderForm || onAdd) && (
              <Button className="!h-6 !px-2 !py-0 text-xs" onClick={openAdd}>
                Add {entityName}
              </Button>
            )}
          </div>
        </div>

        {/* --- Active Filters Toolbar --- */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 border-b bg-gray-50/40 px-3 py-1.5 dark:bg-zinc-900/30">
            {Object.entries(filterValues).map(([key, val]) => {
              const field = filterFields?.find((f) => f.id === key)
              const label = field?.label || key
              const optionLabel =
                field?.options?.find((o) => o.value === val)?.label || val

              return (
                <span
                  key={key}
                  className="inline-flex !h-6 items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0 text-[11px] text-gray-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-gray-300"
                >
                  <span>
                    <span className="font-medium">{label}:</span>{" "}
                    {String(optionLabel)}
                  </span>
                  <button
                    type="button"
                    className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-gray-100 hover:text-destructive dark:hover:bg-zinc-800"
                    onClick={() => {
                      const newValues = { ...filterValues }
                      delete newValues[key]
                      onFilterChange?.(newValues)
                    }}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {label} filter</span>
                  </button>
                </span>
              )
            })}
            <Button
              variant="ghost"
              onClick={onFilterClear}
              className="!h-6 !px-2 !py-0 text-[10px] text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* --- Data Table --- */}
        <div className="relative w-full flex-1 overflow-auto">
          <Table className="w-full caption-bottom text-xs">
            <TableHeader className="sticky top-0 z-10 bg-gray-50 shadow-sm backdrop-blur dark:bg-zinc-900/80">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="!h-6 border-b-0">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="!h-6 px-3 py-0 text-left align-middle text-xs font-semibold text-gray-700 dark:text-gray-300"
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
                    className="!h-6 border-b border-gray-100 dark:border-zinc-800"
                  >
                    <TableCell
                      colSpan={tableColumns.length}
                      className="px-3 py-0"
                    >
                      <Skeleton className="h-4 w-full bg-gray-100 dark:bg-zinc-800" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="!h-6 border-b border-gray-100 transition-colors hover:bg-gray-50/50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-3 py-0 align-middle text-xs"
                      >
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
                    className="h-24 text-center text-xs text-muted-foreground"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* --- Bottom Pagination Footer --- */}
        <div className="flex flex-col items-center justify-between border-t border-gray-200 bg-white px-3 py-1.5 text-xs sm:flex-row dark:border-zinc-800 dark:bg-zinc-950">
          {/* Left: Total records */}
          <div className="text-muted-foreground">
            Total <span className="font-bold text-foreground">{rowCount}</span>
          </div>

          {/* Right: Controls (Limit & Pages) */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 sm:mt-0">
            {/* Lines per page */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Lines per page</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(val) =>
                  onPaginationChange({ pageIndex: 0, pageSize: Number(val) })
                }
              >
                <SelectTrigger className="!h-6 !min-h-0 w-[55px] !px-2 !py-0 text-xs shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="py-1 text-xs">
                    10
                  </SelectItem>
                  <SelectItem value="15" className="py-1 text-xs">
                    15
                  </SelectItem>
                  <SelectItem value="20" className="py-1 text-xs">
                    20
                  </SelectItem>
                  <SelectItem value="50" className="py-1 text-xs">
                    50
                  </SelectItem>
                  <SelectItem value="100" className="py-1 text-xs">
                    100
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Button
                variant="ghost"
                className="!h-6 !w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={() =>
                  updatePage(Math.max(0, pagination.pageIndex - 1))
                }
                disabled={pagination.pageIndex === 0 || isLoading}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              <div className="flex items-center gap-1 font-medium">
                {paginationItems.map((page, idx) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-1 tracking-widest text-muted-foreground"
                      >
                        ..
                      </span>
                    )
                  }

                  const isCurrent = page === pagination.pageIndex
                  return (
                    <Button
                      key={`page-${page}`}
                      variant={isCurrent ? "default" : "ghost"}
                      className={`!h-6 min-w-[24px] !px-1.5 !py-0 text-xs ${
                        isCurrent
                          ? "font-bold"
                          : "font-normal text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => updatePage(page as number)}
                      disabled={isLoading}
                    >
                      {(page as number) + 1}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="ghost"
                className="!h-6 !w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => updatePage(pagination.pageIndex + 1)}
                disabled={pagination.pageIndex >= totalPages - 1 || isLoading}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Add / Edit Form Dialog --- */}
      {renderForm && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="flex flex-col gap-0 overflow-hidden border-0 p-0 sm:max-w-md">
            <DialogHeader className="p-4">
              <DialogTitle className="text-sm">
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
              <AlertDialogTitle className="text-sm">
                Delete {entityName}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
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
              <AlertDialogCancel
                className="!h-6 !px-3 !py-0 text-xs"
                disabled={isDeleting}
                size={"xs"}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="text-destructive-foreground !h-6 bg-destructive !px-3 !py-0 text-xs hover:bg-destructive/90"
                size={"xs"}
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
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>Delete</span>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
