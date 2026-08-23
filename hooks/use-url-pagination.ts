"use client"

import { useSearchParams } from "next/navigation"

export function useUrlPagination() {
  const searchParams = useSearchParams()

  const page = Number(searchParams.get("page")) || 1
  const size = Number(searchParams.get("size")) || 100

  return {
    page,
    size,
    pagination: {
      pageIndex: page - 1,
      pageSize: size,
    },
  }
}
