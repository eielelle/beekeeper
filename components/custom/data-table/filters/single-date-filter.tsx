"use client"

import * as React from "react"
import { Column, RowData } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "lucide-react"

import { DataTableFeatures } from "@/hooks/use-data-table"
import { FilterPayload } from "@/types/filter-payloads"

export function DateFilter<TData extends RowData, TValue = unknown>({
  column,
  title,
}: {
  column: Column<DataTableFeatures, TData, TValue>
  title: string
}) {
  const filterPayload = column.getFilterValue() as
    Extract<FilterPayload, { operator: "eq" }> | undefined

  const currentValue =
    typeof filterPayload?.value === "string" ? filterPayload.value : ""

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const payload: FilterPayload = { operator: "eq", value: e.target.value }
      column.setFilterValue(payload)
    } else {
      column.setFilterValue(undefined)
    }
  }

  const clearFilter = () => column.setFilterValue(undefined)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="xs" className="">
          <Calendar className="mr-2 h-4 w-4" />
          {title}
          {currentValue && (
            <>
              {/* Divider between title and selected value */}
              <span className="mx-2 h-4 w-px bg-border" />
              <span className="rounded-sm bg-secondary px-1 text-xs font-normal">
                {currentValue}
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[220px] p-3">
        <div className="flex flex-col space-y-3">
          <span className="text-xs font-medium text-muted-foreground">
            Filter {title}
          </span>
          <Input
            type="date"
            value={currentValue}
            onChange={handleChange}
            className="h-8 w-full text-xs font-normal"
          />
          {currentValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
              className="h-8 w-full text-xs"
            >
              Clear filter
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
