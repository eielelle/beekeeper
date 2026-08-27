"use client"

import * as React from "react"
import { Column, RowData } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { DataTableFeatures } from "@/hooks/use-data-table"
import { FilterPayload } from "@/types/filter-payloads"

export function CheckboxFilter<TData extends RowData, TValue = unknown>({
  column,
  options,
}: {
  column: Column<DataTableFeatures, TData, TValue>
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
    <div
      className="mt-2 flex flex-col space-y-2"
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <Checkbox
            id={`${column.id}-${option.value}`}
            checked={selectedValues.has(option.value)}
            onCheckedChange={() => toggleOption(option.value)}
          />
          <Label
            htmlFor={`${column.id}-${option.value}`}
            className="cursor-pointer text-xs font-medium"
          >
            {option.label}
          </Label>
        </div>
      ))}
      {selectedValues.size > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.setFilterValue(undefined)}
          className="h-6 text-xs"
        >
          Clear
        </Button>
      )}
    </div>
  )
}
