"use client"

import { useSearchParams } from "next/navigation"
import { columns } from "@/components/custom/data-table/columns/department"
import { DataTable } from "@/components/custom/data-table/core/data-table"
import { fetchDepartments } from "@/forms/queries/department.query"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useCreateAtom, useSelector } from "@tanstack/react-store"
import type { PaginationState } from "@tanstack/react-table"
import { useUrlPagination } from "@/hooks/use-url-pagination"

export default function Tabletest() {
  const { page, size } = useUrlPagination()

  const attendances = useQuery({
    queryKey: ["adepartments", page, size],
    queryFn: () =>
      fetchDepartments({
        pageIndex: page - 1,
        pageSize: size,
      }),
    placeholderData: keepPreviousData,
  })

  const a = attendances?.data
  const d = a?.data ?? []

  // 3. Compute pageCount dynamically based on rowCount and current pageSize
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
