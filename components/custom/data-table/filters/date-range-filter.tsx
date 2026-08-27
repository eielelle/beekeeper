"use client"

import * as React from "react"
import { Column, RowData } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { DataTableFeatures } from "@/hooks/use-data-table"
import { FilterPayload } from "@/types/filter-payloads"

export function DateRangeFilter<TData extends RowData, TValue = unknown>({
  column,
}: {
  column: Column<DataTableFeatures, TData, TValue>
}) {
  const filterPayload = column.getFilterValue() as
    Extract<FilterPayload, { operator: "range" }> | undefined

  const startDate =
    typeof filterPayload?.min === "string" ? filterPayload.min : ""
  const endDate =
    typeof filterPayload?.max === "string" ? filterPayload.max : ""

  const handleStartDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const payload: FilterPayload = {
      operator: "range",
      min: e.target.value || null,
      max: endDate || null,
    }
    column.setFilterValue(payload)
  }

  const handleEndDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const payload: FilterPayload = {
      operator: "range",
      min: startDate || null,
      max: e.target.value || null,
    }
    column.setFilterValue(payload)
  }

  return (
    <div
      className="mt-2 flex flex-col space-y-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center space-x-2">
        <Input
          type="date"
          value={startDate}
          onChange={handleStartDate}
          className="h-8 w-full text-xs font-normal"
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="date"
          value={endDate}
          onChange={handleEndDate}
          className="h-8 w-full text-xs font-normal"
        />
      </div>
      {(startDate || endDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.setFilterValue(undefined)}
          className="h-6 text-xs font-normal text-muted-foreground"
        >
          <X className="mr-1 h-3 w-3" /> Clear dates
        </Button>
      )}
    </div>
  )
}
