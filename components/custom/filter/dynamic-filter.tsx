"use client"

import * as React from "react"
import { Filter, X, Check, ChevronsUpDown, Loader2 } from "lucide-react"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export type FilterType = "text" | "select" | "date" | "combobox"

export interface FilterField {
  id: string
  label: string
  type: FilterType
  options?: { label: string; value: string; description?: string }[] // Required for select/combobox
  placeholder?: string
  // Combobox specific props
  onSearchChange?: (val: string) => void // Allows parent to fetch options dynamically
  isLoading?: boolean // Shows a spinner while searching
}

interface DynamicFilterProps {
  title?: string
  description?: string
  fields: FilterField[]
  values: Record<string, string>
  onApply: (values: Record<string, string>) => void
  onClear: () => void
}

// Internal component to manage individual combobox popover state cleanly
function FilterCombobox({
  field,
  value,
  onChange,
}: {
  field: FilterField
  value: string
  onChange: (val: string, label?: string) => void
}) {
  const [open, setOpen] = React.useState(false)

  // Find the selected option to display its label
  const selectedOption = field.options?.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {value && value !== " "
              ? selectedOption?.label || value
              : field.placeholder || `Select ${field.label}`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={!field.onSearchChange}>
          <CommandInput
            placeholder={`Search ${field.label.toLowerCase()}...`}
            onValueChange={field.onSearchChange}
          />
          <CommandList>
            {field.isLoading ? (
              <div className="flex h-16 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !field.options || field.options.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                <CommandItem
                  value=" "
                  onSelect={() => {
                    onChange(" ", "All")
                    setOpen(false)
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === " " || !value ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  All
                </CommandItem>
                {field.options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => {
                      onChange(opt.value, opt.label)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value === opt.value ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{opt.label}</span>
                      {opt.description && (
                        <span className="text-xs text-muted-foreground">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
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

  // Cache labels for async comboboxes so badges don't revert to raw IDs when search results change
  const [labelCache, setLabelCache] = React.useState<Record<string, string>>({})

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

  const updateDraftValue = (key: string, val: string, label?: string) => {
    setDraftValues((prev) => ({ ...prev, [key]: val }))
    if (label && val !== " ") {
      setLabelCache((prev) => ({ ...prev, [val]: label }))
    }
  }

  // Count active filters (ignoring empty strings or undefined)
  const activeKeys = Object.keys(values).filter((key) => Boolean(values[key]))
  const activeCount = activeKeys.filter((k) => values[k] !== " ").length

  // Helper to get human-readable labels for badges
  const getBadgeDisplay = (key: string, val: string) => {
    const field = fields.find((f) => f.id === key)
    if (!field) return val

    if (field.type === "select" || field.type === "combobox") {
      const option = field.options?.find((o) => o.value === val)
      const label = option ? option.label : labelCache[val] || val
      return `${field.label}: ${label}`
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
                    onValueChange={(val) => updateDraftValue(field.id, val)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          field.placeholder || `Select ${field.label}`
                        }
                      />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom">
                      <SelectItem value=" ">All</SelectItem>
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === "combobox" && (
                  <FilterCombobox
                    field={field}
                    value={draftValues[field.id] || ""}
                    onChange={(val, label) =>
                      updateDraftValue(field.id, val, label)
                    }
                  />
                )}

                {(field.type === "text" || field.type === "date") && (
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={draftValues[field.id] || ""}
                    onChange={(e) => updateDraftValue(field.id, e.target.value)}
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
                className="flex items-center gap-1 pr-1 font-normal"
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
