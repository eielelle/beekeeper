"use client"

import { useSearchParams } from "next/navigation"
import { columns } from "@/components/custom/data-table/columns/department"
import { DataTable } from "@/components/custom/data-table/core/data-table"
import { fetchDepartments } from "@/forms/queries/department.query"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useCreateAtom, useSelector } from "@tanstack/react-store"
import type { PaginationState } from "@tanstack/react-table"
import { useUrlTableState } from "@/hooks/use-url-table-state"

export default function Tabletest() {
  // 1. Extract `sorting` from your URL state hook
  const { page, size, sorting } = useUrlTableState()

  const attendances = useQuery({
    // 2. Add `sorting` to the queryKey so React Query refetches when it changes
    queryKey: ["departments", page, size, sorting],
    queryFn: () =>
      fetchDepartments({
        pageIndex: page - 1,
        pageSize: size,
        sorting, // 3. Pass the sorting payload to your query function
      }),
    placeholderData: keepPreviousData,
  })

  const a = attendances?.data
  const d = a?.data ?? []

  const rowCount = a?.rowCount ?? 1
  const pageCount = Math.ceil(rowCount / size)

  return (
    <DataTable
      tkey="att"
      columns={columns}
      data={d}
      pageCount={pageCount}
      rowCount={rowCount}
    />
  )
}
