"use client"

import * as React from "react"
import { ArrowUpDown } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface SortOption {
  label: string
  value: string // Usually formatted as "column_name-is_descending", e.g., "created_at-true"
}

export interface DynamicSorterProps {
  options: SortOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DynamicSorter({
  options,
  value,
  onValueChange,
  placeholder = "Sort by",
  className,
}: DynamicSorterProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn("h-9 w-full text-sm sm:w-[180px]", className)}
      >
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent position="popper" side="bottom">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
