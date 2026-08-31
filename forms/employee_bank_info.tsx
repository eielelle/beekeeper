"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { Save, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  employeeSchema,
  type EmployeeFormValues,
} from "./schemas/employee.schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const ACCOUNT_TYPE_OPTIONS = ["Savings", "Checking"] as const

export function EmployeeBankInformation({
  initialData,
  onSubmitAction,
}: {
  initialData?: Partial<EmployeeFormValues>
  onSubmitAction: (data: Partial<EmployeeFormValues>) => Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const defaultValues = {
    banks: initialData?.banks || [],
  }

  const form = useForm({
    defaultValues,
    // Since this form only handles banks, you may want a specialized Zod schema
    // just for this slice if you require strict validation on isolation.
    // For now, it updates the `banks` array as defined in your main schema.
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true)
        await onSubmitAction(value)
        toast.success("Bank information saved successfully")
      } catch (error: any) {
        toast.error(error.message || "Failed to save bank information")
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <Card className="pt-0">
          <CardHeader className="flex flex-row items-center justify-between bg-primary p-2">
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form.Field name="banks" mode="array">
              {(field) => (
                <div className="mt-4 space-y-4">
                  {field.state.value.map((_, index) => (
                    <div
                      key={index}
                      className="relative flex flex-col gap-4 rounded-md border bg-muted/20 p-4"
                    >
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <form.Field name={`banks[${index}].bank_name` as any}>
                          {(subField) => (
                            <Field className="col-span-2">
                              <FieldLabel>Bank Name</FieldLabel>
                              <Input
                                placeholder="e.g. BDO, BPI, UnionBank"
                                value={subField.state.value as string}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value as any)
                                }
                              />
                            </Field>
                          )}
                        </form.Field>

                        <form.Field
                          name={`banks[${index}].account_number` as any}
                        >
                          {(subField) => (
                            <Field className="col-span-2">
                              <FieldLabel>Account Number</FieldLabel>
                              <Input
                                placeholder="Account Number"
                                value={subField.state.value as string}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value as any)
                                }
                              />
                            </Field>
                          )}
                        </form.Field>

                        <form.Field
                          name={`banks[${index}].account_type` as any}
                        >
                          {(subField) => (
                            <Field className="col-span-2">
                              <FieldLabel>Account Type</FieldLabel>
                              <Combobox
                                items={ACCOUNT_TYPE_OPTIONS}
                                defaultInputValue={
                                  subField.state.value ||
                                  ACCOUNT_TYPE_OPTIONS[0]
                                }
                              >
                                <ComboboxInput
                                  placeholder="Select Type"
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value as any)
                                  }
                                />
                                <ComboboxContent>
                                  <ComboboxEmpty>Nothing found.</ComboboxEmpty>
                                  <ComboboxList>
                                    {ACCOUNT_TYPE_OPTIONS.map((item) => (
                                      <ComboboxItem
                                        key={item}
                                        value={item}
                                        onSelect={() =>
                                          subField.handleChange(item as any)
                                        }
                                      >
                                        {item}
                                      </ComboboxItem>
                                    ))}
                                  </ComboboxList>
                                </ComboboxContent>
                              </Combobox>
                            </Field>
                          )}
                        </form.Field>

                        <form.Field name={`banks[${index}].branch_code` as any}>
                          {(subField) => (
                            <Field className="col-span-1">
                              <FieldLabel>Branch Code</FieldLabel>
                              <Input
                                placeholder="Optional"
                                value={(subField.state.value || "") as string}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value as any)
                                }
                              />
                            </Field>
                          )}
                        </form.Field>

                        <form.Field name={`banks[${index}].is_primary` as any}>
                          {(subField) => (
                            <div className="col-span-1 flex h-full items-center space-x-2 pt-6">
                              <input
                                type="checkbox"
                                id={`primary-bank-${index}`}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={subField.state.value as boolean}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  subField.handleChange(checked as any)

                                  // Optional: If you want to ensure only ONE bank is primary at a time
                                  if (checked) {
                                    field.state.value.forEach((_, i) => {
                                      if (i !== index) {
                                        form.setFieldValue(
                                          `banks[${i}].is_primary` as any,
                                          false as any
                                        )
                                      }
                                    })
                                  }
                                }}
                              />
                              <label
                                htmlFor={`primary-bank-${index}`}
                                className="cursor-pointer text-sm leading-none font-medium"
                              >
                                Set as Primary
                              </label>
                            </div>
                          )}
                        </form.Field>
                      </div>

                      <div className="mt-2 flex justify-end border-t pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          type="button"
                          onClick={() => field.removeValue(index)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remove Account
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    className="mt-2"
                    onClick={() =>
                      field.pushValue({
                        bank_name: "",
                        account_number: "",
                        account_type: "Savings",
                        branch_code: "",
                        is_primary: field.state.value.length === 0, // Automatically make the first one primary
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Bank Account
                  </Button>
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmittingState]) => (
              <Button
                type="button"
                onClick={form.handleSubmit}
                disabled={!canSubmit || isSubmitting || isSubmittingState}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Bank Details"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </CardContent>
    </Card>
  )
}
