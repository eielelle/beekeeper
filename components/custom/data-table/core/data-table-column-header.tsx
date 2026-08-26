"use client"

import type { Column, RowData } from "@tanstack/react-table"
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  EyeOff,
  PinOff,
  X,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { features } from "@/hooks/use-data-table"
import { useUrlTableState } from "@/hooks/use-url-table-state"

// Extends DropdownMenuTrigger props so you can still pass className if needed
interface ColumnSortProps<
  TData extends RowData,
  TValue,
> extends React.ComponentProps<typeof DropdownMenuTrigger> {
  // Strict typing using your v9 features setup
  column: Column<typeof features, TData, TValue>
  label: string
}

export function ColumnSort<TData extends RowData, TValue>({
  column,
  label,
  className,
  ...props
}: ColumnSortProps<TData, TValue>) {
  const { sorting, setSorting } = useUrlTableState()

  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{label}</div>
  }

  // 1. Read sorting state directly from the URL hook instead of table internal state
  const currentSort = sorting.find((s) => s.id === column.id)
  const sortedState = currentSort ? (currentSort.desc ? "desc" : "asc") : null

  // 2. Extracted URL setter logic to keep the JSX clean
  const setAsc = () => setSorting([{ id: column.id, desc: false }])
  const setDesc = () => setSorting([{ id: column.id, desc: true }])
  const clearSort = () =>
    setSorting((prev) => prev.filter((s) => s.id !== column.id))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "-ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent focus:ring-1 focus:ring-ring focus:outline-none data-[state=open]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          className
        )}
        {...props}
      >
        {label}
        {column.getCanSort() &&
          (sortedState === "desc" ? (
            <ChevronDown />
          ) : sortedState === "asc" ? (
            <ChevronUp />
          ) : (
            <ChevronsUpDown />
          ))}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-28">
        {column.getCanPin() && (
          <>
            {column.getIsPinned() !== "start" && (
              <DropdownMenuItem onClick={() => column.pin("start")}>
                <ArrowLeftToLine className="mr-2 h-4 w-4 text-muted-foreground" />
                Pin to Left
              </DropdownMenuItem>
            )}
            {column.getIsPinned() !== "end" && (
              <DropdownMenuItem onClick={() => column.pin("end")}>
                <ArrowRightToLine className="mr-2 h-4 w-4 text-muted-foreground" />
                Pin to Right
              </DropdownMenuItem>
            )}
            {column.getIsPinned() && (
              <DropdownMenuItem onClick={() => column.pin(false)}>
                <PinOff className="mr-2 h-4 w-4 text-muted-foreground" />
                Unpin Column
              </DropdownMenuItem>
            )}
          </>
        )}

        {column.getCanSort() && (
          <>
            <DropdownMenuCheckboxItem
              className="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={sortedState === "asc"}
              onClick={setAsc}
            >
              <ChevronUp />
              Asc
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              className="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={sortedState === "desc"}
              onClick={setDesc}
            >
              <ChevronDown />
              Desc
            </DropdownMenuCheckboxItem>
            {sortedState && (
              <DropdownMenuItem
                className="pl-2 [&_svg]:text-muted-foreground"
                onClick={clearSort}
              >
                <X />
                Reset
              </DropdownMenuItem>
            )}
          </>
        )}
        {/* Visibility remains client-side, so we keep the native methods here */}
        {column.getCanHide() && (
          <DropdownMenuCheckboxItem
            className="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
            checked={!column.getIsVisible()}
            onClick={() => column.toggleVisibility()}
          >
            <EyeOff />
            Hide
          </DropdownMenuCheckboxItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
