"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

import {
  createVisit,
  getVisit,
  updateVisit,
  searchOutlets,
  searchVisitTypes,
} from "@/forms/queries/visit.query"
import { visitSchema } from "@/forms/schemas/visit.schema"

const getFirstItem = (data: any) => (Array.isArray(data) ? data[0] : data)

const DAYS_OF_WEEK = [
  { id: "mon", label: "M" },
  { id: "tue", label: "T" },
  { id: "wed", label: "W" },
  { id: "thu", label: "Th" },
  { id: "fri", label: "F" },
  { id: "sat", label: "Sa" },
  { id: "sun", label: "Su" },
]

export function VisitForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  const params = useParams()
  let id = params?.id as string | undefined
  if (editId) id = editId
  const isEditMode = !!id

  // --- Search States ---
  const [outletOpen, setOutletOpen] = useState(false)
  const [outletSearch, setOutletSearch] = useState("")
  const [debouncedOutlet, setDebouncedOutlet] = useState("")

  const [typeOpen, setTypeOpen] = useState(false)
  const [typeSearch, setTypeSearch] = useState("")
  const [debouncedType, setDebouncedType] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedOutlet(outletSearch), 300)
    return () => clearTimeout(timer)
  }, [outletSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedType(typeSearch), 300)
    return () => clearTimeout(timer)
  }, [typeSearch])

  // --- Queries ---
  const { data: outletResults = [], isLoading: isLoadingOutlets } = useQuery({
    queryKey: ["outlet-options", debouncedOutlet],
    queryFn: () => searchOutlets(debouncedOutlet, 20),
  })
  const outletOptions = outletResults.map((o) => ({
    value: Number(o.id),
    label: `${o.outlet_code} - ${o.outlet_name}`,
  }))

  const { data: typeResults = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["visit-type-options", debouncedType],
    queryFn: () => searchVisitTypes(debouncedType, 20),
  })
  const typeOptions = typeResults.map((t) => ({
    value: Number(t.id),
    label: t.type_name,
  }))

  const { data: visitData, isLoading: isLoadingVisit } = useQuery({
    queryKey: ["visits", id],
    queryFn: () => getVisit(id!),
    enabled: isEditMode,
  })

  // --- Mutation ---
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof visitSchema>) => {
      if (isEditMode) {
        return updateVisit({ ...values, id })
      }
      return createVisit(values)
    },
    onSuccess: () => {
      form.reset()
      if (onClose) onClose()
    },
  })

  const dv: z.input<typeof visitSchema> = {
    outlet_id: visitData?.outlet_id ?? 0,
    visit_type_id: visitData?.visit_type_id ?? 0,
    start_date: visitData?.start_date ?? "",
    end_date: visitData?.end_date ?? "",
    start_time: visitData?.start_time ?? "",
    end_time: visitData?.end_time ?? "",
    notes: visitData?.notes ?? "",
    repeats_every: visitData?.repeats_every ?? "none",
    repeat_on: visitData?.repeat_on ?? [],
  }

  const form = useForm({
    defaultValues: dv,
    validators: { onSubmit: visitSchema },
    onSubmit: async ({ value }) => {
      // If it doesn't repeat weekly, clear the repeat_on array
      if (value.repeats_every !== "week") {
        value.repeat_on = []
      }
      // Convert 'none' to null for DB storage
      if (value.repeats_every === "none") {
        value.repeats_every = null
      }
      mutation.mutate(value)
    },
  })

  if (isEditMode && isLoadingVisit) {
    return (
      <div className="flex items-center space-x-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading visit details...</span>
      </div>
    )
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* OUTLET COMBOBOX */}
        <form.Field name="outlet_id">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            const selectedOption = outletOptions.find(
              (opt) => opt.value === field.state.value
            )
            const outlet = getFirstItem(visitData?.outlets)
            const displayLabel = selectedOption
              ? selectedOption.label
              : outlet
                ? `${outlet.outlet_code} - ${outlet.outlet_name}`
                : field.state.value
                  ? "Selected Outlet"
                  : "Select Outlet..."

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Target Outlet <span className="text-red-500">*</span>
                </FieldLabel>
                <Popover open={outletOpen} onOpenChange={setOutletOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={mutation.isPending}
                    >
                      <span className="truncate pr-2">{displayLabel}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search Outlet..."
                        value={outletSearch}
                        onValueChange={setOutletSearch}
                      />
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        {isLoadingOutlets && (
                          <div className="p-2 text-center text-xs text-muted-foreground">
                            Searching...
                          </div>
                        )}
                        {!isLoadingOutlets && outletOptions.length === 0 && (
                          <CommandEmpty>No Outlet found.</CommandEmpty>
                        )}
                        <CommandGroup>
                          {outletOptions.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.label}
                              onSelect={() => {
                                field.handleChange(
                                  option.value === field.state.value
                                    ? 0
                                    : option.value
                                )
                                setOutletOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  field.state.value === option.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <span className="truncate">{option.label}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* VISIT TYPE COMBOBOX */}
        <form.Field name="visit_type_id">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            const selectedOption = typeOptions.find(
              (opt) => opt.value === field.state.value
            )
            const type = getFirstItem(visitData?.visit_types)
            const displayLabel = selectedOption
              ? selectedOption.label
              : type
                ? type.type_name
                : field.state.value
                  ? "Selected Type"
                  : "Select Visit Type..."

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Visit Type <span className="text-red-500">*</span>
                </FieldLabel>
                <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={mutation.isPending}
                    >
                      <span className="truncate pr-2">{displayLabel}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search Type..."
                        value={typeSearch}
                        onValueChange={setTypeSearch}
                      />
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        {isLoadingTypes && (
                          <div className="p-2 text-center text-xs text-muted-foreground">
                            Searching...
                          </div>
                        )}
                        {!isLoadingTypes && typeOptions.length === 0 && (
                          <CommandEmpty>No Type found.</CommandEmpty>
                        )}
                        <CommandGroup>
                          {typeOptions.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.label}
                              onSelect={() => {
                                field.handleChange(
                                  option.value === field.state.value
                                    ? 0
                                    : option.value
                                )
                                setTypeOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  field.state.value === option.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <span className="truncate">{option.label}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>
      </div>

      {/* DATE & TIME ROW */}
      <div className="grid gap-4 md:grid-cols-2">
        <form.Field name="start_date">
          {(field) => (
            <Field
              data-invalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
            >
              <FieldLabel>
                Start Date <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                type="date"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={mutation.isPending}
              />
              {field.state.meta.isTouched && !field.state.meta.isValid && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        </form.Field>

        <form.Field name="end_date">
          {(field) => (
            <Field
              data-invalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
            >
              <FieldLabel>
                End Date <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                type="date"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={mutation.isPending}
              />
              {field.state.meta.isTouched && !field.state.meta.isValid && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        </form.Field>

        <form.Field name="start_time">
          {(field) => (
            <Field
              data-invalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
            >
              <FieldLabel>Start Time</FieldLabel>
              <Input
                type="time"
                value={field.state.value || ""}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={mutation.isPending}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="end_time">
          {(field) => (
            <Field
              data-invalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
            >
              <FieldLabel>End Time</FieldLabel>
              <Input
                type="time"
                value={field.state.value || ""}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={mutation.isPending}
              />
            </Field>
          )}
        </form.Field>
      </div>

      <hr />

      {/* REPEAT SCHEDULE */}
      <div className="space-y-4 rounded-md border bg-muted/20 p-4">
        <h4 className="text-sm font-semibold">Recurring Schedule</h4>

        <form.Field name="repeats_every">
          {(field) => (
            <Field>
              <FieldLabel>Repeats</FieldLabel>
              <Select
                value={field.state.value || "none"}
                onValueChange={field.handleChange}
                disabled={mutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select repeat frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="day">Every Day</SelectItem>
                  <SelectItem value="week">Every Week</SelectItem>
                  <SelectItem value="month">Every Month</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        {/* ONLY SHOW DAYS OF WEEK IF 'WEEK' IS SELECTED */}
        <form.Subscribe selector={(state) => state.values.repeats_every}>
          {(repeatsEvery) =>
            repeatsEvery === "week" && (
              <form.Field name="repeat_on">
                {(field) => {
                  const selectedDays = field.state.value || []

                  const toggleDay = (dayId: string) => {
                    if (selectedDays.includes(dayId)) {
                      field.handleChange(
                        selectedDays.filter((d) => d !== dayId)
                      )
                    } else {
                      field.handleChange([...selectedDays, dayId])
                    }
                  }

                  return (
                    <Field>
                      <FieldLabel>Repeat On</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSelected = selectedDays.includes(day.id)
                          return (
                            <Button
                              key={day.id}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              className={cn(
                                "h-9 w-12 rounded-full p-0",
                                isSelected &&
                                  "ring-2 ring-primary ring-offset-2 ring-offset-background"
                              )}
                              onClick={() => toggleDay(day.id)}
                              disabled={mutation.isPending}
                            >
                              {day.label}
                            </Button>
                          )
                        })}
                      </div>
                    </Field>
                  )
                }}
              </form.Field>
            )
          }
        </form.Subscribe>
      </div>

      <hr />

      {/* NOTES */}
      <form.Field name="notes">
        {(field) => (
          <Field
            data-invalid={
              field.state.meta.isTouched && !field.state.meta.isValid
            }
          >
            <FieldLabel>Notes</FieldLabel>
            <Textarea
              value={field.state.value || ""}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Add any instructions or context for this visit..."
              disabled={mutation.isPending}
              rows={3}
            />
          </Field>
        )}
      </form.Field>

      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending
          ? "Saving..."
          : isEditMode
            ? "Update Visit"
            : "Schedule Visit"}
      </Button>
    </form>
  )
}
