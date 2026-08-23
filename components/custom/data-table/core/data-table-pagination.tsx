"use client"

import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTableFeatures, useAppTable } from "@/hooks/use-data-table"
import { useQueryParams } from "@/hooks/use-query-params"
import { RowData, Table } from "@tanstack/react-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface DataTablePaginationProps<TData extends RowData> {
  table: Table<DataTableFeatures, TData>
}

export default function DataTablePagination<TData extends RowData>({
  table,
}: DataTablePaginationProps<TData>) {
  const { getParam, setParam, removeParam } = useQueryParams()

  const page = getParam("page")

  function prev() {
    if (table.getCanPreviousPage()) {
      const currentPage = Number(page ?? "1")

      setParam("page", String(Math.max(1, currentPage - 1)))
    }
  }

  function next() {
    if (table.getCanNextPage()) {
      const currentPage = Number(page ?? "1")

      setParam("page", String(currentPage + 1))
    }
  }

  return (
    <footer className="flex items-center justify-end">
      {/* 
        Basic Pagination Controls 
        (You can swap this section out entirely with <DataTablePagination table={table} />) 
      */}
      <div className="flex items-center justify-end space-x-2 py-2">
        <button
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => prev()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        {/* for loop using table.getPageCount() but only 1, 2, 3, ..., 5 */}
        <button
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => next()}
          disabled={!table.getCanNextPage()}
        >
          Next Page
        </button>
      </div>
      <p>
        Showing {1} to {12} of {table.getRowCount()} results
      </p>

      <p>Rows per page:</p>
      <Select value="100">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Page">100</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
            <SelectItem value="500">500</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </footer>
  )
}
