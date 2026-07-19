"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  SortingState,
} from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type FilterPreset = {
  label: string
  value: string
}

interface DataTableProps<TData extends { id?: string | number }> {
  // Page Header Details
  title: string
  description?: string
  entityName?: string // e.g., "SKU Category" (used in Dialog headings and labels)

  // Data & Pagination
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  rowCount: number
  isLoading?: boolean

  // Search & Filters
  searchPlaceholder?: string
  globalFilter: string
  onSearchChange: (value: string) => void
  filterPresets?: FilterPreset[]
  activeFilter?: string
  onFilterChange?: (value: string) => void

  // Pagination & Sorting State
  pagination: PaginationState
  onPaginationChange: React.Dispatch<React.SetStateAction<PaginationState>>
  sorting: SortingState
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>

  // Form Render Prop & Mutations
  renderForm: (props: {
    id?: string | number | null
    onClose: () => void
  }) => React.ReactNode
  onDelete?: (id: string | number) => Promise<void> | void
  isDeleting?: boolean
  getItemDisplayName?: (item: TData) => string
}

export function DataTable<TData extends { id?: string | number }>({
  title,
  description,
  entityName = "Item",
  columns,
  data,
  rowCount,
  isLoading = false,
  searchPlaceholder = "Search...",
  globalFilter,
  onSearchChange,
  filterPresets = [],
  activeFilter = "",
  onFilterChange,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  renderForm,
  onDelete,
  isDeleting = false,
  getItemDisplayName,
}: DataTableProps<TData>) {
  // Inner Dialog States
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | number | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [deletingItem, setDeletingItem] = React.useState<TData | null>(null)

  const handleOpenAdd = () => {
    setEditingId(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (id: string | number) => {
    setEditingId(id)
    setIsFormOpen(true)
  }

  const handleOpenDelete = (item: TData) => {
    setDeletingItem(item)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (deletingItem?.id && onDelete) {
      await onDelete(deletingItem.id)
      setIsDeleteOpen(false)
      setDeletingItem(null)
    }
  }

  // Inject Actions Column (Edit/Delete) automatically if onDelete or renderForm are passed
  const tableColumns = React.useMemo(() => {
    const actionsColumn: ColumnDef<TData, unknown> = {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleOpenEdit(item.id!)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => handleOpenDelete(item)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    }

    return [...columns, actionsColumn]
  }, [columns, onDelete])

  const table = useReactTable({
    data,
    columns: tableColumns,
    pageCount: Math.ceil(rowCount / pagination.pageSize),
    state: { pagination, sorting },
    onPaginationChange,
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
  })

  return (
    <>
      <section className="space-y-6">
        {/* Header + Add Action */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add {entityName}
          </Button>
        </header>

        {/* Search + Filters */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => {
                onSearchChange(e.target.value)
                onPaginationChange((prev) => ({ ...prev, pageIndex: 0 }))
              }}
              className="pl-9 text-sm"
            />
          </div>

          {filterPresets.length > 0 && onFilterChange && (
            <div className="flex items-center gap-1.5 rounded-lg border bg-muted/50 p-1">
              {filterPresets.map((preset) => {
                const isActive = activeFilter === preset.value
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      onFilterChange(preset.value)
                      onPaginationChange((prev) => ({ ...prev, pageIndex: 0 }))
                    }}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Table View */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
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
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="h-24 text-center"
                  >
                    Loading records...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
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
                    colSpan={tableColumns.length}
                    className="h-24 text-center"
                  >
                    No records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-muted-foreground">
            Showing {data.length} of {rowCount} items
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || isLoading}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="px-2 text-xs text-muted-foreground">
              Page {pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || isLoading}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Embedded Add / Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md lg:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? `Edit ${entityName}` : `Add ${entityName}`}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? `Update the details for this ${entityName.toLowerCase()}.`
                : `Fill out the information below to create a new ${entityName.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>
          {renderForm({ id: editingId, onClose: () => setIsFormOpen(false) })}
        </DialogContent>
      </Dialog>

      {/* Embedded Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">
                {deletingItem && getItemDisplayName
                  ? getItemDisplayName(deletingItem)
                  : "this item"}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
