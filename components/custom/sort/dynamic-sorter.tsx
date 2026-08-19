"use client"

import * as React from "react"
import { ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface SortOption {
  label: string
  value: string
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
      {/* Added h-10 (40px default) or h-11/h-12 for larger inputs */}
      <SelectTrigger className={cn("h-[60px] w-[180px]", className)}>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
