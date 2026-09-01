"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Save, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  employeeWorkInfoSchema,
  type EmployeeWorkFormValues,
} from "./schemas/employee_work_info.schema"
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
  getEmployeeWorkInfo,
  upsertEmployeeWorkInfo,
  searchDepartments,
  searchPositions,
  searchEmploymentTypes,
  searchWorkTypes,
  searchEmploymentStatuses,
} from "./queries/employee_work_info.query"

// Define base defaults OUTSIDE the component to avoid circular dependencies
const BASE_DEFAULT_VALUES: Partial<EmployeeWorkFormValues> = {
  department_id: "",
  job_position_id: "",
  reports_to_id: "",
  employment_type_id: "",
  work_type_id: "",
  employment_status_id: "",
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
}

export function EmployeeWorkInformation({
  initialData,
  onSubmitAction,
}: {
  initialData?: Partial<EmployeeWorkFormValues>
  onSubmitAction?: (data: EmployeeWorkFormValues) => Promise<void>
}) {
  const params = useParams()
  const employeeId = params?.id as string
  const isEditMode = !!employeeId

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [employeeData, setEmployeeData] = React.useState<
    Partial<EmployeeWorkFormValues>
  >({})

  // Dropdown States
  const [departments, setDepartments] = React.useState<
    { value: string; label: string }[]
  >([])
  const [positions, setPositions] = React.useState<
    { value: string; label: string }[]
  >([])
  const [employmentTypes, setEmploymentTypes] = React.useState<
    { value: string; label: string }[]
  >([])
  const [workTypes, setWorkTypes] = React.useState<
    { value: string; label: string }[]
  >([])
  const [employmentStatuses, setEmploymentStatuses] = React.useState<
    { value: string; label: string }[]
  >([])

  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)

        // Concurrently fetch all lookup arrays
        const [deps, pos, eTypes, wTypes, eStatuses] = await Promise.all([
          searchDepartments(""),
          searchPositions(""),
          searchEmploymentTypes(""),
          searchWorkTypes(""),
          searchEmploymentStatuses(""),
        ])

        setDepartments(deps)
        setPositions(pos)
        setEmploymentTypes(eTypes)
        setWorkTypes(wTypes)
        setEmploymentStatuses(eStatuses)

        // Fetch existing employee work info if in edit mode
        if (isEditMode) {
          const data = await getEmployeeWorkInfo(employeeId)
          if (data) setEmployeeData(data)
        }
      } catch (error: any) {
        toast.error("Failed to load data: " + error.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, isEditMode])

  const form = useForm({
    defaultValues: {
      ...BASE_DEFAULT_VALUES,
      ...initialData,
      ...employeeData,
    } as EmployeeWorkFormValues,
    validators: {
      onSubmit: employeeWorkInfoSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true)
        if (employeeId) {
          await upsertEmployeeWorkInfo(employeeId, value)
        } else {
          throw new Error("Missing Employee ID. Cannot save work info.")
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to save work information")
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  // Prevent form rendering until data is fetched so useForm mounts with correct default values
  if (isLoading) {
    return (
      <Card className="flex h-64 items-center justify-center border-dashed">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading work information...
          </span>
        </div>
      </Card>
    )
  }

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
              <form.Field name="employment_status_id">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Employment Status{" "}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={(field.state.value as string) || undefined}
                      onValueChange={(val) => field.handleChange(val as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentStatuses.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="employment_type_id">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Employment Type{" "}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={(field.state.value as string) || undefined}
                      onValueChange={(val) => field.handleChange(val as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentTypes.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="work_type_id">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Work Arrangement/Type{" "}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={(field.state.value as string) || undefined}
                      onValueChange={(val) => field.handleChange(val as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Arrangement" />
                      </SelectTrigger>
                      <SelectContent>
                        {workTypes.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={field.state.meta.errors} />
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
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="department_id">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Department <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={(field.state.value as string) || undefined}
                      onValueChange={(val) => field.handleChange(val as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="job_position_id">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Job Position <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={(field.state.value as string) || undefined}
                      onValueChange={(val) => field.handleChange(val as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="reports_to_id">
                {(field) => (
                  <Field>
                    <FieldLabel>Reports To (Manager ID)</FieldLabel>
                    <Input
                      placeholder="Enter Manager ID"
                      value={(field.state.value || "") as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
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
                    <FieldError errors={field.state.meta.errors} />
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
                    <FieldError errors={field.state.meta.errors} />
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
                    <FieldError errors={field.state.meta.errors} />
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
                    <FieldError errors={field.state.meta.errors} />
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
                    <FieldError errors={field.state.meta.errors} />
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
                    <FieldError errors={field.state.meta.errors} />
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
                    <FieldError errors={field.state.meta.errors} />
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
                    <FieldError errors={field.state.meta.errors} />
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
                    <FieldError errors={field.state.meta.errors} />
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
                    <FieldError errors={field.state.meta.errors} />
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
                    <FieldError errors={field.state.meta.errors} />
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
