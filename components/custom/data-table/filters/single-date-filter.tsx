"use client"

import * as React from "react"
import { Column, RowData } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { DataTableFeatures } from "@/hooks/use-data-table"
import { FilterPayload } from "@/types/filter-payloads"

export function DateFilter<TData extends RowData, TValue = unknown>({
  column,
}: {
  column: Column<DataTableFeatures, TData, TValue>
}) {
  const filterPayload = column.getFilterValue() as
    Extract<FilterPayload, { operator: "eq" }> | undefined

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const payload: FilterPayload = { operator: "eq", value: e.target.value }
      column.setFilterValue(payload)
    } else {
      column.setFilterValue(undefined)
    }
  }

  return (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      <Input
        type="date"
        value={
          typeof filterPayload?.value === "string" ? filterPayload.value : ""
        }
        onChange={handleChange}
        className="h-8 w-full text-xs font-normal"
      />
    </div>
  )
}
