"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  EMPLOYMENT_TYPE_OPTIONS,
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

// Extracted from your schema enums for the Comboboxes
const EMPLOYEE_STATUS_OPTIONS = [
  "Hired",
  "Terminated",
  "Suspended",
  "Candidate",
] as const
const WORK_ARRANGEMENT_OPTIONS = ["On-site", "Hybrid", "WFH"] as const

export function EmployeeWorkInformation({
  initialData,
  onSubmitAction,
}: {
  initialData?: Partial<EmployeeFormValues>
  onSubmitAction: (data: EmployeeFormValues) => Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Default values for the work information slice of the schema
  const defaultValues = {
    employee_status: "Hired",
    department_id: "",
    job_position_id: "",
    reports_to_id: "",
    employment_type: "Regular",
    work_arrangement: "On-site",
    effective_start_date: "",
    lifecycles: {
      original_hire_date: "",
      current_hire_date: "",
      probation_end_date: "",
      regularization_date: "",
      contract_expiry_date: "",
    },
    statutory: {
      sss_number: "",
      tin: "",
      rdo_code: "",
      philhealth_number: "",
      pagibig_number: "",
      national_id: "",
    },
    ...initialData,
  } as EmployeeFormValues

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: employeeSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true)
        await onSubmitAction(value)
        toast.success("Work information saved successfully")
      } catch (error: any) {
        toast.error(error.message || "Failed to save work information")
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {/* Employment Details */}
        <Card className="pt-0">
          <CardHeader className="bg-primary p-2">
            <CardTitle>Employment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <form.Field name="employee_status">
                {(field) => (
                  <Field>
                    <FieldLabel>Employee Status</FieldLabel>
                    <Combobox
                      items={EMPLOYEE_STATUS_OPTIONS}
                      defaultInputValue={field.state.value}
                    >
                      <ComboboxInput
                        placeholder="Select Status"
                        onChange={(e) =>
                          field.handleChange(e.target.value as any)
                        }
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>Nothing found.</ComboboxEmpty>
                        <ComboboxList>
                          {EMPLOYEE_STATUS_OPTIONS.map((item) => (
                            <ComboboxItem
                              key={item}
                              value={item}
                              onSelect={() => field.handleChange(item as any)}
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

              <form.Field name="employment_type">
                {(field) => (
                  <Field>
                    <FieldLabel>Employment Type</FieldLabel>
                    <Combobox
                      items={EMPLOYMENT_TYPE_OPTIONS}
                      defaultInputValue={field.state.value}
                    >
                      <ComboboxInput
                        placeholder="Select Type"
                        onChange={(e) =>
                          field.handleChange(e.target.value as any)
                        }
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>Nothing found.</ComboboxEmpty>
                        <ComboboxList>
                          {EMPLOYMENT_TYPE_OPTIONS.map((item) => (
                            <ComboboxItem
                              key={item}
                              value={item}
                              onSelect={() => field.handleChange(item as any)}
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

              <form.Field name="work_arrangement">
                {(field) => (
                  <Field>
                    <FieldLabel>Work Arrangement</FieldLabel>
                    <Combobox
                      items={WORK_ARRANGEMENT_OPTIONS}
                      defaultInputValue={field.state.value}
                    >
                      <ComboboxInput
                        placeholder="Select Arrangement"
                        onChange={(e) =>
                          field.handleChange(e.target.value as any)
                        }
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>Nothing found.</ComboboxEmpty>
                        <ComboboxList>
                          {WORK_ARRANGEMENT_OPTIONS.map((item) => (
                            <ComboboxItem
                              key={item}
                              value={item}
                              onSelect={() => field.handleChange(item as any)}
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

              <form.Field name="effective_start_date">
                {(field) => (
                  <Field>
                    <FieldLabel>Effective Start Date</FieldLabel>
                    <Input
                      type="date"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="department_id">
                {(field) => (
                  <Field>
                    <FieldLabel>Department (ID)</FieldLabel>
                    <Input
                      placeholder="e.g. uuid-of-department"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="job_position_id">
                {(field) => (
                  <Field>
                    <FieldLabel>Job Position (ID)</FieldLabel>
                    <Input
                      placeholder="e.g. uuid-of-position"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="reports_to_id">
                {(field) => (
                  <Field>
                    <FieldLabel>Reports To (Manager ID)</FieldLabel>
                    <Input
                      placeholder="e.g. uuid-of-manager"
                      value={(field.state.value || "") as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Lifecycles & Dates */}
        <Card className="pt-0">
          <CardHeader className="bg-primary p-2">
            <CardTitle>Lifecycles & Important Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <form.Field name="lifecycles.original_hire_date">
                {(field) => (
                  <Field>
                    <FieldLabel>Original Hire Date</FieldLabel>
                    <Input
                      type="date"
                      value={(field.state.value || "") as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="lifecycles.current_hire_date">
                {(field) => (
                  <Field>
                    <FieldLabel>Current Hire Date</FieldLabel>
                    <Input
                      type="date"
                      value={(field.state.value || "") as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="lifecycles.probation_end_date">
                {(field) => (
                  <Field>
                    <FieldLabel>Probation End Date</FieldLabel>
                    <Input
                      type="date"
                      value={(field.state.value || "") as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="lifecycles.regularization_date">
                {(field) => (
                  <Field>
                    <FieldLabel>Regularization Date</FieldLabel>
                    <Input
                      type="date"
                      value={(field.state.value || "") as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="lifecycles.contract_expiry_date">
                {(field) => (
                  <Field>
                    <FieldLabel>Contract Expiry Date</FieldLabel>
                    <Input
                      type="date"
                      value={(field.state.value || "") as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Statutory & Government IDs */}
        <Card className="pt-0">
          <CardHeader className="bg-primary p-2">
            <CardTitle>Statutory & Government IDs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <form.Field name="statutory.sss_number">
                {(field) => (
                  <Field>
                    <FieldLabel>SSS Number</FieldLabel>
                    <Input
                      placeholder="XX-XXXXXXX-X"
                      value={(field.state.value || "") as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="statutory.philhealth_number">
                {(field) => (
                  <Field>
                    <FieldLabel>PhilHealth Number</FieldLabel>
                    <Input
                      placeholder="XX-XXXXXXXXX-X"
                      value={(field.state.value || "") as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="statutory.pagibig_number">
                {(field) => (
                  <Field>
                    <FieldLabel>Pag-IBIG Number</FieldLabel>
                    <Input
                      placeholder="XXXX-XXXX-XXXX"
                      value={(field.state.value || "") as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="statutory.tin">
                {(field) => (
                  <Field>
                    <FieldLabel>TIN</FieldLabel>
                    <Input
                      placeholder="XXX-XXX-XXX-XXX"
                      value={(field.state.value || "") as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="statutory.rdo_code">
                {(field) => (
                  <Field>
                    <FieldLabel>RDO Code</FieldLabel>
                    <Input
                      placeholder="e.g. 039"
                      value={(field.state.value || "") as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="statutory.national_id">
                {(field) => (
                  <Field>
                    <FieldLabel>National ID</FieldLabel>
                    <Input
                      placeholder="National ID"
                      value={(field.state.value || "") as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                  </Field>
                )}
              </form.Field>
            </div>
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
                {isSubmitting ? "Saving..." : "Save Work Information"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </CardContent>
    </Card>
  )
}
