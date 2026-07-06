"use client"

import * as React from "react"
import { SortingState } from "@tanstack/react-table"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useDebouncedValue } from "./use-debounced-value"

export function useTable() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [pageIndex, setPageIndex] = React.useState(
    Number(searchParams.get("page") ?? 0)
  )

  const [pageSize, setPageSize] = React.useState(
    Number(searchParams.get("size") ?? 10)
  )

  const [sorting, setSorting] = React.useState<SortingState>([])

  const [globalFilter, setGlobalFilter] = React.useState(
    searchParams.get("search") ?? ""
  )

  const debouncedSearch = useDebouncedValue(globalFilter, 400)

  // 🔗 sync URL
  React.useEffect(() => {
    const params = new URLSearchParams()

    params.set("page", String(pageIndex))
    params.set("size", String(pageSize))

    if (debouncedSearch) params.set("search", debouncedSearch)

    router.replace(`${pathname}?${params.toString()}`)
  }, [pageIndex, pageSize, debouncedSearch])

  return {
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
    debouncedSearch,
  }
}
