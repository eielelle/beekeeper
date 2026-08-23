"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function useQueryParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())

    params.set(key, value)

    router.push(`${pathname}?${params.toString()}`)
  }

  function getParam(key: string) {
    return searchParams.get(key)
  }

  function removeParam(key: string) {
    const params = new URLSearchParams(searchParams.toString())

    params.delete(key)

    const query = params.toString()

    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return {
    getParam,
    setParam,
    removeParam,
  }
}
