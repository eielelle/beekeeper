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
      <SelectTrigger
        className={cn(
          // Ultra-small constraints: 24px height, 11px font, tiny padding
          "!h-6 !min-h-0 !px-1.5 !py-0 !text-[11px] sm:w-[120px]",
          // Force Shadcn's default dropdown chevron to 10px
          "[&>svg]:!h-2.5 [&>svg]:!w-2.5 [&>svg]:!opacity-70",
          className
        )}
      >
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
          <span className="truncate pt-[1px] leading-none">
            <SelectValue placeholder={placeholder} />
          </span>
        </div>
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" className="min-w-[100px]">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className={cn(
              // Tiny text and padding for the dropdown items
              "!py-1 !pr-1 !pl-5 !text-[11px]",
              // Shrink and reposition the active checkmark icon on the left
              "[&>span]:!left-1 [&>span>svg]:!h-2.5 [&>span>svg]:!w-2.5"
            )}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
