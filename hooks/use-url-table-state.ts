"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import type { SortingState, Updater } from "@tanstack/react-table"

export function useUrlTableState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // -----------------------------
  // Pagination
  // -----------------------------

  const page = Number(searchParams.get("page")) || 1

  const size = Number(searchParams.get("size")) || 100

  const pagination = {
    pageIndex: page - 1,
    pageSize: size,
  }

  // -----------------------------
  // Sorting
  // -----------------------------

  const sortParam = searchParams.get("sort")

  const sorting: SortingState = sortParam
    ? sortParam
        .split(",")
        .map((value) => {
          const [id, direction] = value.split(".")

          return {
            id,
            desc: direction === "desc",
          }
        })
        .filter((sort) => sort.id)
    : []

  // -----------------------------
  // Update URL
  // -----------------------------

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  // -----------------------------
  // Sorting setter
  // -----------------------------

  const setSorting = (updater: Updater<SortingState>) => {
    const nextSorting =
      typeof updater === "function" ? updater(sorting) : updater

    const nextSortParam =
      nextSorting.length > 0
        ? nextSorting
            .map((sort) => `${sort.id}.${sort.desc ? "desc" : "asc"}`)
            .join(",")
        : null

    updateParams({
      sort: nextSortParam,
      page: "1",
    })
  }

  return {
    page,
    size,
    pagination,

    sorting,
    setSorting,
  }
}
