"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUrlTableState } from "@/hooks/use-url-table-state"

interface DataTableGlobalSearchProps {
  placeholder?: string
}

export function DataTableGlobalSearch({
  placeholder = "Search all columns...",
}: DataTableGlobalSearchProps) {
  // 1. Hook into your unified URL state
  const { globalFilter, setGlobalFilter } = useUrlTableState()

  // 2. Local state for immediate typing feedback
  const [query, setQuery] = React.useState(globalFilter)

  // 3. Sync local state if the URL changes externally (e.g., Back button)
  React.useEffect(() => {
    setQuery(globalFilter)
  }, [globalFilter])

  // --- DEBOUNCE LOGIC ---
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      // Only push to URL if the local state actually differs
      if (query !== globalFilter) {
        setGlobalFilter(query)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, globalFilter, setGlobalFilter])

  return (
    <div className="relative flex items-center">
      <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-8 w-[250px] pr-8 pl-8 lg:w-[300px]"
      />
      {/* Clear Button */}
      {query.length > 0 && (
        <Button
          variant="ghost"
          onClick={() => setQuery("")}
          className="absolute right-0 h-8 w-8 p-0 hover:bg-transparent"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </Button>
      )}
    </div>
  )
}
