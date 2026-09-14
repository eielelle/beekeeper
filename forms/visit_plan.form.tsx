"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
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
  visitPlanSchema,
  VisitPlanFormValues,
} from "./schemas/visit_plan.schema"
import { createVisitPlan } from "./queries/visit_plan.query"
import {
  searchOutletsAction,
  searchVisitTypesAction,
} from "@/actions/visit.action"

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// ----------------------------------------------------------------------
// Sub-component for individual visit array items
// ----------------------------------------------------------------------
function VisitItemRow({
  field,
  index,
  onRemove,
  isOnlyItem,
}: {
  field: any
  index: number
  onRemove: () => void
  isOnlyItem: boolean
}) {
  const [outletOpen, setOutletOpen] = React.useState(false)
  const [outletSearch, setOutletSearch] = React.useState("")
  const debouncedOutletSearch = useDebounce(outletSearch, 300)
  const [selectedOutletName, setSelectedOutletName] = React.useState("")

  const [typeOpen, setTypeOpen] = React.useState(false)
  const [typeSearch, setTypeSearch] = React.useState("")
  const debouncedTypeSearch = useDebounce(typeSearch, 300)
  const [selectedTypeName, setSelectedTypeName] = React.useState("")

  const { data: outlets } = useQuery({
    queryKey: ["outlets-search", debouncedOutletSearch],
    queryFn: () => searchOutletsAction(debouncedOutletSearch),
  })

  const { data: visitTypes } = useQuery({
    queryKey: ["visit-types-search", debouncedTypeSearch],
    queryFn: () => searchVisitTypesAction(debouncedTypeSearch),
  })

  return (
    <Card className="relative mb-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        disabled={isOnlyItem}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <FieldLabel>Outlet</FieldLabel>
            <Popover open={outletOpen} onOpenChange={setOutletOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {field.value.outlet_id && selectedOutletName
                    ? selectedOutletName
                    : "Search outlet..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search outlets..."
                    value={outletSearch}
                    onValueChange={setOutletSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No outlets found.</CommandEmpty>
                    <CommandGroup>
                      {outlets?.map((outlet) => (
                        <CommandItem
                          key={outlet.id}
                          value={String(outlet.id)}
                          onSelect={(val) => {
                            field.handleChange({
                              ...field.value,
                              outlet_id: val,
                            })
                            setSelectedOutletName(outlet.outlet_name)
                            setOutletOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value.outlet_id === String(outlet.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {outlet.outlet_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <FieldLabel>Visit Type</FieldLabel>
            <Popover open={typeOpen} onOpenChange={setTypeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {field.value.visit_type_id && selectedTypeName
                    ? selectedTypeName
                    : "Search type..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search visit types..."
                    value={typeSearch}
                    onValueChange={setTypeSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No visit types found.</CommandEmpty>
                    <CommandGroup>
                      {visitTypes?.map((type) => (
                        <CommandItem
                          key={type.id}
                          value={String(type.id)}
                          onSelect={(val) => {
                            field.handleChange({
                              ...field.value,
                              visit_type_id: val,
                            })
                            setSelectedTypeName(type.type_name)
                            setTypeOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value.visit_type_id === String(type.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {type.type_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <FieldLabel>Start Date</FieldLabel>
            <Input
              type="date"
              value={field.value.start_date}
              onChange={(e) =>
                field.handleChange({
                  ...field.value,
                  start_date: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>End Date</FieldLabel>
            <Input
              type="date"
              value={field.value.end_date}
              onChange={(e) =>
                field.handleChange({ ...field.value, end_date: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel>Notes</FieldLabel>
          <Textarea
            value={field.value.notes ?? ""}
            onChange={(e) =>
              field.handleChange({ ...field.value, notes: e.target.value })
            }
            placeholder="Visit objectives or details..."
            rows={2}
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ----------------------------------------------------------------------
// Main Form Component
// ----------------------------------------------------------------------
export function VisitPlanForm() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (values: VisitPlanFormValues) => createVisitPlan(values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["visit-plans"] }),
  })

  const form = useForm({
    defaultValues: {
      title: "",
      start_date: "",
      end_date: "",
      remarks: "",
      visits: [
        {
          uid: "initial",
          outlet_id: "",
          visit_type_id: "",
          start_date: "",
          end_date: "",
          notes: "",
        },
      ],
    },
    validators: { onChange: visitPlanSchema as any },
    onSubmit: async ({ value }) => await mutation.mutateAsync(value),
  })

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      {/* PLAN DETAILS */}
      <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Plan Details</h3>
        <form.Field name="title">
          {(field) => (
            <Field
              data-invalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
            >
              <FieldLabel>
                Plan Title <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g., Q3 South Region Coverage"
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <div className="grid grid-cols-2 gap-4">
          <form.Field name="start_date">
            {(field) => (
              <Field
                data-invalid={
                  field.state.meta.isTouched && !field.state.meta.isValid
                }
              >
                <FieldLabel>
                  Plan Start Date <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
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
                  Plan End Date <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
        </div>

        <form.Field name="remarks">
          {(field) => (
            <Field>
              <FieldLabel>Remarks</FieldLabel>
              <Textarea
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Overall plan notes..."
                rows={2}
                className="resize-none"
              />
            </Field>
          )}
        </form.Field>
      </div>

      {/* VISITS ARRAY */}
      <form.Field name="visits" mode="array">
        {(field) => {
          const visits = field.state.value || []

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Scheduled Visits</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    field.pushValue({
                      uid: "initial",
                      outlet_id: "",
                      visit_type_id: "",
                      start_date: "",
                      end_date: "",
                      notes: "",
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Visit
                </Button>
              </div>

              {visits.map((visit, index) => (
                <form.Field key={visit.uid} name={`visits[${index}]`}>
                  {(subField) => (
                    <VisitItemRow
                      field={subField}
                      index={index}
                      onRemove={() => field.removeValue(index)}
                      isOnlyItem={visits.length === 1}
                    />
                  )}
                </form.Field>
              ))}
              <FieldError errors={field.state.meta.errors} />
            </div>
          )
        }}
      </form.Field>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating Plan..." : "Save Visit Plan"}
        </Button>
      </div>
    </form>
  )
}
