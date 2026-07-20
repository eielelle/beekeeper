"use client"

import * as React from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export type FilterType = "text" | "select" | "date"

export interface FilterField {
  id: string
  label: string
  type: FilterType
  options?: { label: string; value: string }[] // Required if type === "select"
  placeholder?: string
}

interface DynamicFilterProps {
  title?: string
  description?: string
  fields: FilterField[]
  values: Record<string, string>
  onApply: (values: Record<string, string>) => void
  onClear: () => void
}

export function DynamicFilter({
  title = "Filter Records",
  description = "Narrow down the results.",
  fields,
  values,
  onApply,
  onClear,
}: DynamicFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [draftValues, setDraftValues] =
    React.useState<Record<string, string>>(values)

  // Sync draft values when sheet opens
  React.useEffect(() => {
    if (isOpen) {
      setDraftValues(values)
    }
  }, [isOpen, values])

  const handleApply = () => {
    onApply(draftValues)
    setIsOpen(false)
  }

  const handleReset = () => {
    setDraftValues({})
    onClear()
    setIsOpen(false)
  }

  const removeFilter = (key: string) => {
    const newValues = { ...values }
    delete newValues[key]
    onApply(newValues)
  }

  // Count active filters (ignoring empty strings or undefined)
  const activeKeys = Object.keys(values).filter((key) => Boolean(values[key]))
  const activeCount = activeKeys.length

  // Helper to get human-readable labels for badges
  const getBadgeDisplay = (key: string, val: string) => {
    const field = fields.find((f) => f.id === key)
    if (!field) return val

    if (field.type === "select" && field.options) {
      const option = field.options.find((o) => o.value === val)
      return `${field.label}: ${option ? option.label : val}`
    }
    return `${field.label}: ${val}`
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 rounded-full px-1.5 py-0.5 text-xs"
              >
                {activeCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex w-[350px] flex-col sm:w-[450px]">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 p-4">
            {fields.map((field) => (
              <div key={field.id} className="flex flex-col gap-2">
                <label className="text-xs font-medium">{field.label}</label>

                {field.type === "select" && field.options && (
                  <Select
                    value={draftValues[field.id] || ""}
                    onValueChange={(val) =>
                      setDraftValues({ ...draftValues, [field.id]: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          field.placeholder || `Select ${field.label}`
                        }
                      />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom">
                      {/* Empty string acts as the "All" or "Reset" choice for a select */}
                      <SelectItem value=" ">All</SelectItem>
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {(field.type === "text" || field.type === "date") && (
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={draftValues[field.id] || ""}
                    onChange={(e) =>
                      setDraftValues({
                        ...draftValues,
                        [field.id]: e.target.value,
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <SheetFooter>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleReset}>
                Reset
              </Button>
              <Button onClick={handleApply}>Apply Filters</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Active Filters Inline Row */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeKeys.map((key) => {
            // Treat literal space string as empty to allow deselecting
            if (values[key] === " ") return null

            return (
              <Badge
                key={key}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {getBadgeDisplay(key, values[key])}
                <button
                  type="button"
                  className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20 focus:outline-none"
                  onClick={() => removeFilter(key)}
                >
                  <X className="h-3 w-3 text-secondary-foreground" />
                  <span className="sr-only">Remove {key} filter</span>
                </button>
              </Badge>
            )
          })}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={onClear}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
