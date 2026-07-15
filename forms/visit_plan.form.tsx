"use client"

import * as React from "react"
import { useForm, useStore } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { CalendarDays, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  createVisitPlan,
  getVisitPlan,
  updateVisitPlan,
  fetchVisitsByDateRange,
} from "./queries/visit_plan.query"
import { visitPlanSchema } from "./schemas/visit_plan.schema"

const getFirstItem = (data: any) => (Array.isArray(data) ? data[0] : data)

export function VisitPlanForm({
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

  // We store the full visit details object here to render the rich table
  const [visitDetails, setVisitDetails] = useState<Record<string, any>>({})

  const { data: planData, isLoading: isLoadingPlan } = useQuery({
    queryKey: ["visit_plans", id],
    queryFn: () => getVisitPlan(id!),
    enabled: isEditMode,
  })

  // Pre-load details for existing tied visits
  useEffect(() => {
    if (isEditMode && planData?.visit_plan_items) {
      const details: Record<string, any> = {}
      planData.visit_plan_items.forEach((item: any) => {
        if (item.visits) {
          details[item.visit_id] = item.visits
        }
      })
      setVisitDetails((prev) => ({ ...prev, ...details }))
    }
  }, [isEditMode, planData])

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof visitPlanSchema>) => {
      if (isEditMode) {
        return updateVisitPlan(id!, values)
      }
      return createVisitPlan(values)
    },
    onSuccess: () => {
      form.reset()
      if (onClose) onClose()
    },
  })

  const dv: z.input<typeof visitPlanSchema> = {
    title: planData?.title ?? "",
    start_date: planData?.start_date ?? "",
    end_date: planData?.end_date ?? "",
    start_time: planData?.start_time ?? "",
    end_time: planData?.end_time ?? "",
    remarks: planData?.remarks ?? "",
    items: planData?.visit_plan_items
      ? planData.visit_plan_items.map((i: any) => ({ visit_id: i.visit_id }))
      : [],
  }

  const form = useForm({
    defaultValues: dv,
    validators: { onSubmit: visitPlanSchema },
    onSubmit: async ({ value }) => {
      // Fix: Convert empty strings to null for PostgreSQL TIME columns
      if (value.start_time === "") value.start_time = null
      if (value.end_time === "") value.end_time = null

      mutation.mutate(value)
    },
  })

  // --- Reactive Auto-Fill Logic ---
  const startDate = useStore(form.store, (state) => state.values.start_date)
  const endDate = useStore(form.store, (state) => state.values.end_date)

  const [syncedDates, setSyncedDates] = useState("")

  const { data: autoVisits = [], isFetching: isFetchingAutoVisits } = useQuery({
    queryKey: ["auto-visits", startDate, endDate],
    queryFn: () => fetchVisitsByDateRange(startDate, endDate),
    enabled:
      !!startDate && !!endDate && new Date(startDate) <= new Date(endDate),
  })

  useEffect(() => {
    const currentRange = `${startDate}_${endDate}`

    if (
      startDate &&
      endDate &&
      !isFetchingAutoVisits &&
      syncedDates !== currentRange
    ) {
      if (isEditMode && syncedDates === "") {
        setSyncedDates(currentRange)
        return
      }

      const newDetails: Record<string, any> = {}
      const newItems = autoVisits.map((v) => {
        newDetails[v.id] = v // Store the whole object for the table to use
        return { visit_id: String(v.id) }
      })

      setVisitDetails((prev) => ({ ...prev, ...newDetails }))
      form.setFieldValue("items", newItems)
      setSyncedDates(currentRange)

      if (newItems.length > 0) {
        toast.success(
          `Auto-attached ${newItems.length} visits for this date range.`
        )
      } else {
        toast.info("No scheduled visits found in this date range.")
      }
    }
  }, [
    autoVisits,
    isFetchingAutoVisits,
    startDate,
    endDate,
    syncedDates,
    isEditMode,
    form,
  ])

  if (isEditMode && isLoadingPlan) {
    return (
      <div className="flex items-center space-x-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading plan details...</span>
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
      {/* HEADER SECTION */}
      <div className="space-y-4">
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
                placeholder="e.g., Q3 Northern Route"
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

        <div className="grid grid-cols-2 gap-4">
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
                <FieldLabel>Start Time (Opt)</FieldLabel>
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
                <FieldLabel>End Time (Opt)</FieldLabel>
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

        <form.Field name="remarks">
          {(field) => (
            <Field
              data-invalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
            >
              <FieldLabel>Remarks</FieldLabel>
              <Textarea
                placeholder="Objectives or notes for this plan..."
                value={field.state.value || ""}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={mutation.isPending}
                rows={2}
              />
            </Field>
          )}
        </form.Field>
      </div>

      <hr />

      {/* AUTO-SYNCED VISITS TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Automatically Tied Visits</h4>
          {isFetchingAutoVisits && (
            <span className="flex items-center text-xs text-muted-foreground">
              <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Syncing...
            </span>
          )}
        </div>

        <form.Field name="items" mode="array">
          {(field) => (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetchingAutoVisits && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                        Fetching visits...
                      </TableCell>
                    </TableRow>
                  )}

                  {!isFetchingAutoVisits && field.state.value.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {startDate && endDate
                          ? "No visits found in this date range."
                          : "Select a Start and End Date to auto-fill visits."}
                      </TableCell>
                    </TableRow>
                  )}

                  {!isFetchingAutoVisits &&
                    field.state.value.map((item, i) => {
                      const details = visitDetails[item.visit_id]

                      const outlet = getFirstItem(details?.outlets)
                      const type = getFirstItem(details?.visit_types)

                      const sDate = details?.start_date
                        ? new Date(details.start_date).toLocaleDateString()
                        : ""
                      const eDate = details?.end_date
                        ? new Date(details.end_date).toLocaleDateString()
                        : ""
                      const dateDisplay =
                        sDate === eDate ? sDate : `${sDate} to ${eDate}`

                      const timeDisplay = details?.start_time
                        ? `${details.start_time} - ${details.end_time || "?"}`
                        : "Anytime"

                      return (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="font-semibold text-primary">
                              {outlet?.outlet_name || `ID: ${item.visit_id}`}
                            </div>
                            {outlet?.outlet_code && (
                              <div className="text-xs text-muted-foreground">
                                {outlet.outlet_code}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-muted/20 font-normal"
                            >
                              {type?.type_name || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <CalendarDays className="mr-2 h-3.5 w-3.5" />
                              {dateDisplay || "—"}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-3.5 w-3.5" />
                              {timeDisplay}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </form.Field>
      </div>

      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending
          ? "Saving..."
          : isEditMode
            ? "Update Plan"
            : "Create Visit Plan"}
      </Button>
    </form>
  )
}
