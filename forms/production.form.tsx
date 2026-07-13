"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  createProduction,
  getProduction,
  updateProduction,
} from "./queries/production.query"
import { searchProductionAreas } from "./queries/production_area.query"
import { searchProductionLines } from "./queries/production_line.query"
import {
  productionSchema,
  type ProductionFormValues,
} from "./schemas/production.schema"

export function ProductionForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  const params = useParams()
  const queryClient = useQueryClient()

  // Prevent hydration mismatch between server HTML and client mount
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  let id = params?.id as string | undefined
  if (editId) {
    id = editId
  }

  const isEditMode = !!id

  // 1. Fetch Production Area options
  const { data: areaOptions = [], isLoading: isLoadingAreas } = useQuery({
    queryKey: ["production_areas_options"],
    queryFn: () => searchProductionAreas(""),
  })

  // 2. Fetch Production Line options
  const { data: lineOptions = [], isLoading: isLoadingLines } = useQuery({
    queryKey: ["production_lines_options"],
    queryFn: () => searchProductionLines(""),
  })

  // 3. Fetch existing production data if in Edit Mode
  const { data: productionData, isLoading: isLoadingProduction } = useQuery({
    queryKey: ["productions", id],
    queryFn: () => getProduction(id!),
    enabled: isEditMode,
  })

  // 4. Handle Create / Update Mutation
  const mutation = useMutation({
    mutationFn: (values: ProductionFormValues) => {
      if (isEditMode) {
        return updateProduction({ ...values, id })
      }
      return createProduction(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productions"] })
      form.reset()
      if (onClose) {
        onClose()
      }
    },
  })

  // 5. Initialize Form
  const form = useForm({
    defaultValues: {
      production_date: productionData?.production_date ?? "",
      production_area: productionData?.production_area
        ? String(productionData.production_area)
        : "",
      production_line: productionData?.production_line
        ? String(productionData.production_line)
        : "",
      shift: (productionData?.shift as "day" | "night") ?? "day",
      operation_type:
        (productionData?.operation_type as
          "startup" | "last_prod" | "regular") ?? "regular",
    },
    validators: {
      onSubmit: productionSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // Sync loaded async data into form fields during edit mode
  React.useEffect(() => {
    if (productionData) {
      form.setFieldValue("production_date", productionData.production_date)
      form.setFieldValue(
        "production_area",
        productionData.production_area
          ? String(productionData.production_area)
          : ""
      )
      form.setFieldValue(
        "production_line",
        productionData.production_line
          ? String(productionData.production_line)
          : ""
      )
      form.setFieldValue("shift", productionData.shift)
      form.setFieldValue("operation_type", productionData.operation_type)
    }
  }, [productionData, form])

  // Hydration guard for disabled props
  const isAreaSelectDisabled = isMounted
    ? mutation.isPending || isLoadingAreas
    : false

  const isLineSelectDisabled = isMounted
    ? mutation.isPending || isLoadingLines
    : false

  if (isEditMode && isLoadingProduction) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading production details...
      </div>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      {/* Production Date */}
      <form.Field name="production_date">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Production Date <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                type="date"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                disabled={isMounted && mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* Production Area */}
      <form.Field name="production_area">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          const currentValue = field.state.value
            ? String(field.state.value)
            : ""

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Production Area <span className="text-red-500">*</span>
              </FieldLabel>
              <Select
                key={currentValue || "area-select"}
                value={currentValue}
                onValueChange={(val) => field.handleChange(val)}
                disabled={isAreaSelectDisabled}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue
                    placeholder={
                      isLoadingAreas && isMounted
                        ? "Loading areas..."
                        : "Select production area"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {areaOptions.map((area) => (
                    <SelectItem key={String(area.id)} value={String(area.id)}>
                      {area.area_code} - {area.area_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* Production Line */}
      <form.Field name="production_line">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          const currentValue = field.state.value
            ? String(field.state.value)
            : ""

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Production Line <span className="text-red-500">*</span>
              </FieldLabel>
              <Select
                key={currentValue || "line-select"}
                value={currentValue}
                onValueChange={(val) => field.handleChange(val)}
                disabled={isLineSelectDisabled}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue
                    placeholder={
                      isLoadingLines && isMounted
                        ? "Loading lines..."
                        : "Select production line"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {lineOptions.map((line) => (
                    <SelectItem key={String(line.id)} value={String(line.id)}>
                      {line.line_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* Shift */}
      <form.Field name="shift">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          const currentValue = field.state.value
            ? String(field.state.value)
            : "day"

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Shift <span className="text-red-500">*</span>
              </FieldLabel>
              <Select
                key={currentValue}
                value={currentValue}
                onValueChange={(val) =>
                  field.handleChange(val as "day" | "night")
                }
                disabled={isMounted && mutation.isPending}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* Operation Type */}
      <form.Field name="operation_type">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          const currentValue = field.state.value
            ? String(field.state.value)
            : "regular"

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Operation Type <span className="text-red-500">*</span>
              </FieldLabel>
              <Select
                key={currentValue}
                value={currentValue}
                onValueChange={(val) =>
                  field.handleChange(val as "startup" | "last_prod" | "regular")
                }
                disabled={isMounted && mutation.isPending}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select operation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="last_prod">Last Production</SelectItem>
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <Button type="submit" disabled={isMounted && mutation.isPending}>
        {mutation.isPending
          ? "Saving..."
          : isEditMode
            ? "Update Production"
            : "Create Production"}
      </Button>
    </form>
  )
}
