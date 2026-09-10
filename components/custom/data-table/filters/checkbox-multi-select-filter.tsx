"use client"

import * as React from "react"
import { Column, RowData } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter } from "lucide-react" // Optional, for a nice filter icon

import { DataTableFeatures } from "@/hooks/use-data-table"
import { FilterPayload } from "@/types/filter-payloads"

export function CheckboxFilter<TData extends RowData, TValue = unknown>({
  column,
  title,
  options,
}: {
  column: Column<DataTableFeatures, TData, TValue>
  title: string
  options: { label: string; value: string }[]
}) {
  const filterPayload = column.getFilterValue() as
    Extract<FilterPayload, { operator: "in" }> | undefined
  const selectedValues = new Set(filterPayload?.values || [])

  const toggleOption = (value: string) => {
    const newSelected = new Set(selectedValues)
    if (newSelected.has(value)) {
      newSelected.delete(value)
    } else {
      newSelected.add(value)
    }

    const filterArray = Array.from(newSelected)

    if (filterArray.length > 0) {
      const payload: FilterPayload = { operator: "in", values: filterArray }
      column.setFilterValue(payload)
    } else {
      column.setFilterValue(undefined)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="xs">
          <Filter className="mr-2 h-4 w-4" />
          {title}
          {/* Optional: Show a badge with the count of active filters */}
          {selectedValues.size > 0 && (
            <>
              <DropdownMenuSeparator className="hidden h-4 md:block" />
              <span className="ml-2 rounded-sm bg-secondary px-1 text-xs font-normal">
                {selectedValues.size} selected
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[200px]">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selectedValues.has(option.value)}
            onCheckedChange={() => toggleOption(option.value)}
            // Prevents the dropdown from closing when selecting multiple items
            onSelect={(e) => e.preventDefault()}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}

        {/* Clear Button at the bottom of the dropdown */}
        {selectedValues.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.setFilterValue(undefined)}
              className="w-full justify-center text-xs font-normal"
            >
              Clear filters
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
