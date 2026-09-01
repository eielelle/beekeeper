"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Plus, Trash2, Save, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  employeeBankSchema,
  type BankEmployeeFormValues,
} from "./schemas/employee_bank_info.schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Import queries
import {
  getEmployeeBanks,
  upsertEmployeeBanks,
} from "./queries/employee_bank_info.query"

const BASE_DEFAULT_VALUES: BankEmployeeFormValues = {
  banks: [],
}

export function EmployeeBankForm({
  initialData,
  onSubmitAction,
}: {
  initialData?: Partial<BankEmployeeFormValues>
  onSubmitAction?: (data: BankEmployeeFormValues) => Promise<void>
}) {
  const params = useParams()
  const employeeId = params?.id as string
  const isEditMode = !!employeeId

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(isEditMode)

  // 1. Initialize the form FIRST with base/initial data
  const form = useForm({
    defaultValues: {
      ...BASE_DEFAULT_VALUES,
      ...initialData,
    } as BankEmployeeFormValues,
    validators: {
      onSubmit: employeeBankSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true)
        if (onSubmitAction) {
          await onSubmitAction(value)
        } else if (employeeId) {
          await upsertEmployeeBanks(employeeId, value)
        } else {
          throw new Error("Missing Employee ID. Cannot save bank information.")
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to save bank information")
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  // 2. Fetch the data, then HYDRATE the form dynamically
  React.useEffect(() => {
    async function loadData() {
      if (isEditMode) {
        try {
          setIsLoading(true)
          const data = await getEmployeeBanks(employeeId)
          if (data && data.banks) {
            // Actively inject the fetched array into the form's state
            form.setFieldValue("banks", data.banks)
          }
        } catch (error: any) {
          toast.error("Failed to load bank data: " + error.message)
        } finally {
          setIsLoading(false)
        }
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, isEditMode])

  // Prevent form rendering until data is fetched
  if (isLoading) {
    return (
      <Card className="flex h-64 items-center justify-center border-dashed">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading bank information...
          </span>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="bg-primary p-2">
        <CardTitle>Bank Accounts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <form.Field name="banks" mode="array">
          {(field) => (
            <div className="space-y-4">
              {field.state.value && field.state.value.length === 0 && (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No bank accounts added yet.
                </div>
              )}

              {field.state.value &&
                field.state.value.map((_, index) => (
                  <div
                    key={index}
                    className="relative flex flex-col gap-4 rounded-md border bg-muted/10 p-4"
                  >
                    {/* Delete Button Container */}
                    <div className="absolute top-4 right-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        type="button"
                        onClick={() => field.removeValue(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pr-10">
                      <form.Field name={`banks[${index}].bank_name` as any}>
                        {(subField) => (
                          <Field>
                            <FieldLabel>
                              Bank Name{" "}
                              <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                              placeholder="e.g. BDO, BPI, UnionBank"
                              value={subField.state.value as string}
                              onChange={(e) =>
                                subField.handleChange(e.target.value as any)
                              }
                            />
                            <FieldError errors={subField.state.meta.errors} />
                          </Field>
                        )}
                      </form.Field>

                      <form.Field
                        name={`banks[${index}].account_number` as any}
                      >
                        {(subField) => (
                          <Field>
                            <FieldLabel>
                              Account Number{" "}
                              <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                              placeholder="Account Number"
                              value={subField.state.value as string}
                              onChange={(e) =>
                                subField.handleChange(e.target.value as any)
                              }
                            />
                            <FieldError errors={subField.state.meta.errors} />
                          </Field>
                        )}
                      </form.Field>

                      <form.Field name={`banks[${index}].account_type` as any}>
                        {(subField) => (
                          <Field>
                            <FieldLabel>
                              Account Type{" "}
                              <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Select
                              value={
                                subField.state.value
                                  ? String(subField.state.value)
                                  : undefined
                              }
                              onValueChange={(val) =>
                                subField.handleChange(val as any)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Savings">Savings</SelectItem>
                                <SelectItem value="Checking">
                                  Checking
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FieldError errors={subField.state.meta.errors} />
                          </Field>
                        )}
                      </form.Field>

                      <form.Field name={`banks[${index}].branch_code` as any}>
                        {(subField) => (
                          <Field>
                            <FieldLabel>Branch Code</FieldLabel>
                            <Input
                              placeholder="Optional"
                              value={(subField.state.value || "") as string}
                              onChange={(e) =>
                                subField.handleChange(e.target.value as any)
                              }
                            />
                            <FieldError errors={subField.state.meta.errors} />
                          </Field>
                        )}
                      </form.Field>
                    </div>

                    <form.Field name={`banks[${index}].is_primary` as any}>
                      {(subField) => (
                        <div className="flex items-center space-x-2 pt-2">
                          <input
                            type="checkbox"
                            id={`primary-bank-${index}`}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={subField.state.value as boolean}
                            onChange={(e) => {
                              const isChecked = e.target.checked
                              subField.handleChange(isChecked as any)

                              // Optional UX: If this is set to primary, uncheck others automatically
                              if (isChecked) {
                                field.state.value.forEach((_, iterIndex) => {
                                  if (iterIndex !== index) {
                                    form.setFieldValue(
                                      `banks[${iterIndex}].is_primary` as any,
                                      false
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
                            Set as Primary Account
                          </label>
                        </div>
                      )}
                    </form.Field>
                  </div>
                ))}

              <FieldError errors={field.state.meta.errors} />

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
                    is_primary: field.state.value?.length === 0, // Auto-primary if first
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Bank Account
              </Button>
            </div>
          )}
        </form.Field>

        <div className="flex justify-end pt-4">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmittingState]) => (
              <Button
                type="button"
                onClick={form.handleSubmit}
                disabled={!canSubmit || isSubmitting || isSubmittingState}
                className="w-[150px]"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Banks"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </CardContent>
    </Card>
  )
}
