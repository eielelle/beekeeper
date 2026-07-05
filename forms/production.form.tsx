"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { Trash2, Plus, ShoppingCart } from "lucide-react"

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

import { submitProductionBatch } from "./queries/production.query"
import { productionFormSchema } from "./schemas/production.schema"

export function ProductionBatchForm() {
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof productionFormSchema>) => {
      return submitProductionBatch(values)
    },
    onSuccess: () => {
      form.reset()
    },
  })

  const form = useForm({
    defaultValues: {
      production_date: "",
      production_area_id: "",
      production_line_id: "",
      shift_type: "",
      operation_type: "",
      items: [{ sku_id: "", qty: "" as unknown as number }],
    },
    validators: {
      onSubmit: productionFormSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      {/* SECTION 1: Master Production Run Metrics */}
      <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-base font-semibold">Batch Details</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <form.Field name="production_date">
            {(field) => (
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Input
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={mutation.isPending}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <form.Field name="shift_type">
            {(field) => (
              <Field>
                <FieldLabel>Shift</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  disabled={mutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <form.Field name="operation_type">
            {(field) => (
              <Field>
                <FieldLabel>Operation Phase</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  disabled={mutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assembly">Assembly</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <form.Field name="production_area_id">
            {(field) => (
              <Field>
                <FieldLabel>Production Area</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  disabled={mutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area-1">Area 1</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <form.Field name="production_line_id">
            {(field) => (
              <Field>
                <FieldLabel>Production Line</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  disabled={mutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select line" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line-1">Line 1</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
        </div>
      </div>

      {/* SECTION 2: Target SKU Cart System */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            Target SKU Cart
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              form.setFieldValue("items", (prev) => [
                ...prev,
                { sku_id: "", qty: 0 },
              ])
            }
          >
            <Plus className="h-4 w-4" /> Add Item Row
          </Button>
        </div>

        {/* Global Cart Validation Banner */}
        <form.Subscribe selector={(state) => state.fieldMeta.items?.errors}>
          {(errors) =>
            errors && errors.length > 0 ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {errors.join(", ")}
              </div>
            ) : null
          }
        </form.Subscribe>

        <div className="space-y-3">
          <form.Field name="items" mode="array">
            {(field) => (
              <>
                {field.state.value.map((_, index) => (
                  <div
                    key={index}
                    className="relative flex items-end gap-3 rounded-xl border bg-card/40 p-4 shadow-sm"
                  >
                    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                      {/* SKU Select Input */}
                      <div className="sm:col-span-2">
                        <form.Field name={`items[${index}].sku_id`}>
                          {(subField) => (
                            <Field>
                              <FieldLabel className="text-xs text-muted-foreground">
                                SKU Product Item #{index + 1}
                              </FieldLabel>
                              <Select
                                value={subField.state.value}
                                onValueChange={subField.handleChange}
                                disabled={mutation.isPending}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Item" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sku-a">
                                    Bread Loaf Type A
                                  </SelectItem>
                                  <SelectItem value="sku-b">
                                    Pastry Pack B
                                  </SelectItem>
                                  <SelectItem value="sku-c">
                                    Cookie Box C
                                  </SelectItem>
                                </SelectContent>
                              </Select>

                              {/* Corrected Error Subscription */}
                              <form.Subscribe
                                selector={(state) =>
                                  state.fieldMeta[`items[${index}].sku_id`]
                                    ?.errors
                                }
                              >
                                {(errors) => <FieldError errors={errors} />}
                              </form.Subscribe>
                            </Field>
                          )}
                        </form.Field>
                      </div>

                      <div>
                        <form.Field name={`items[${index}].qty`}>
                          {(subField) => (
                            <Field>
                              <FieldLabel className="text-xs text-muted-foreground">
                                Quantity Produced
                              </FieldLabel>
                              <Input
                                type="number"
                                placeholder="0"
                                value={
                                  subField.state.value === 0
                                    ? ""
                                    : subField.state.value
                                }
                                onChange={(e) => {
                                  const val = e.target.value
                                  const nextValue =
                                    val === "" ? "" : Number(val)

                                  // Type-cast to the component's exact expected argument type
                                  subField.handleChange(
                                    nextValue as Parameters<
                                      typeof subField.handleChange
                                    >[0]
                                  )
                                }}
                                disabled={mutation.isPending}
                              />

                              <form.Subscribe
                                selector={(state) =>
                                  state.fieldMeta[`items[${index}].qty`]?.errors
                                }
                              >
                                {(errors) => <FieldError errors={errors} />}
                              </form.Subscribe>
                            </Field>
                          )}
                        </form.Field>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={
                        field.state.value.length === 1 || mutation.isPending
                      }
                      onClick={() =>
                        form.setFieldValue("items", (prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </form.Field>
        </div>
      </div>

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="size-lg w-full"
      >
        {mutation.isPending ? "Processing..." : "Submit Production Batch"}
      </Button>
    </form>
  )
}
