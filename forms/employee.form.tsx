"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  BLOOD_TYPE_OPTIONS,
  CIVIL_STATUS_OPTIONS,
  employeeSchema,
  GENDER_OPTIONS,
  ACCOUNT_STATUS_OPTIONS,
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

export function AllInOneEmployeeForm({
  initialData,
  onSubmitAction,
}: {
  initialData?: Partial<EmployeeFormValues>
  onSubmitAction: (data: EmployeeFormValues) => Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSameAddress, setIsSameAddress] = React.useState(false)

  // Explicit defaults based on your updated schema
  const defaultValues: EmployeeFormValues = {
    employee_no: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    maiden_name: "",
    suffix: "",
    nickname: "",
    gender: undefined,
    civil_status: undefined,
    date_of_birth: "",
    nationality: "Filipino",
    blood_type: undefined,
    work_email: "",
    work_phone: "",
    personal_email: "",
    personal_mobile: "",
    account_status: "Active",
    role_id: "",
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
    present_address: {
      full_address: "",
      street_unit: "",
      barangay: "",
      city: "",
      province: "",
      region: "",
      zip_code: "",
      is_active: true,
    },
    permanent_address: {
      full_address: "",
      street_unit: "",
      barangay: "",
      city: "",
      province: "",
      region: "",
      zip_code: "",
      is_active: true,
    },
    emergency_contacts: [
      {
        full_name: "",
        relationship: "",
        mobile_number: "",
        is_primary: true,
      },
    ],
    banks: [],
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

        // If the toggle is active, overwrite permanent_address with present_address before submitting
        const submissionData = {
          ...value,
          permanent_address: isSameAddress
            ? value.present_address
            : value.permanent_address,
        }

        await onSubmitAction(submissionData)
        toast.success("Employee saved successfully")
      } catch (error: any) {
        toast.error(error.message || "Failed to save employee")
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {/* Basic Identity */}
        <Card className="pt-0">
          <CardHeader className="bg-primary p-2">
            <CardTitle>Basic Identity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel>Employee No.</FieldLabel>
                <Input placeholder="EMP-001" type="text" />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input placeholder="Email" type="email" />
              </Field>
              <Field>
                <FieldLabel>Phone</FieldLabel>
                <Input placeholder="Phone" type="text" />
              </Field>
              <Field>
                <FieldLabel>First Name</FieldLabel>
                <Input placeholder="First Name" type="text" />
              </Field>
              <Field>
                <FieldLabel>Middle Name</FieldLabel>
                <Input placeholder="Middle Name" type="text" />
              </Field>
              <Field>
                <FieldLabel>Last Name</FieldLabel>
                <Input placeholder="Last Name" type="text" />
              </Field>
              <Field>
                <FieldLabel>Maiden Name</FieldLabel>
                <Input placeholder="First Name" type="text" />
              </Field>
              <Field>
                <FieldLabel>Suffix</FieldLabel>
                <Input placeholder="Suffix" type="text" />
              </Field>
              <Field>
                <FieldLabel>Nickname</FieldLabel>
                <Input placeholder="Nickname" type="text" />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="pt-0">
          <CardHeader className="bg-primary p-2">
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel>Gender</FieldLabel>
                <Combobox
                  items={GENDER_OPTIONS}
                  defaultInputValue={GENDER_OPTIONS[0]}
                >
                  <ComboboxInput placeholder="Select Gender" />
                  <ComboboxContent>
                    <ComboboxEmpty>Nothing found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
              <Field>
                <FieldLabel>Civil Status</FieldLabel>
                <Combobox
                  items={CIVIL_STATUS_OPTIONS}
                  defaultInputValue={CIVIL_STATUS_OPTIONS[0]}
                >
                  <ComboboxInput placeholder="Select Civil Status" />
                  <ComboboxContent>
                    <ComboboxEmpty>Nothing found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
              <Field>
                <FieldLabel>Nationality</FieldLabel>
                <Input placeholder="Nationality" type="text" />
              </Field>
              <Field>
                <FieldLabel>Date Of Birth</FieldLabel>
                <Input type="date" />
              </Field>
              <Field>
                <FieldLabel>Blood Type</FieldLabel>
                <Combobox
                  items={BLOOD_TYPE_OPTIONS}
                  defaultInputValue={BLOOD_TYPE_OPTIONS[0]}
                >
                  <ComboboxInput placeholder="Select Blood Type" />
                  <ComboboxContent>
                    <ComboboxEmpty>Nothing found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information & Addresses */}
        <Card className="pt-0">
          <CardHeader className="bg-primary p-2">
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-4 mb-8 grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Personal Email</FieldLabel>
                <Input placeholder="Personal Email" type="email" />
              </Field>
              <Field>
                <FieldLabel>Personal Mobile</FieldLabel>
                <Input
                  placeholder="Personal Mobile (e.g. 09171234567)"
                  type="text"
                />
              </Field>
            </div>

            {/* Present Address */}
            <div className="mb-8 space-y-4">
              <h4 className="border-b pb-2 text-sm font-semibold tracking-tight">
                Present Address
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3">
                  <form.Field name="present_address.full_address">
                    {(field) => (
                      <Field>
                        <FieldLabel>Full Address</FieldLabel>
                        <Input
                          placeholder="Full Address"
                          value={field.state.value as string}
                          onChange={(e) =>
                            field.handleChange(e.target.value as any)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                </div>

                <form.Field name="present_address.street_unit">
                  {(field) => (
                    <Field>
                      <FieldLabel>Street / Unit</FieldLabel>
                      <Input
                        placeholder="Street / Unit"
                        value={field.state.value as string}
                        onChange={(e) =>
                          field.handleChange(e.target.value as any)
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="present_address.barangay">
                  {(field) => (
                    <Field>
                      <FieldLabel>Barangay</FieldLabel>
                      <Input
                        placeholder="Barangay"
                        value={field.state.value as string}
                        onChange={(e) =>
                          field.handleChange(e.target.value as any)
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="present_address.city">
                  {(field) => (
                    <Field>
                      <FieldLabel>City</FieldLabel>
                      <Input
                        placeholder="City"
                        value={field.state.value as string}
                        onChange={(e) =>
                          field.handleChange(e.target.value as any)
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="present_address.province">
                  {(field) => (
                    <Field>
                      <FieldLabel>Province</FieldLabel>
                      <Input
                        placeholder="Province"
                        value={field.state.value as string}
                        onChange={(e) =>
                          field.handleChange(e.target.value as any)
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="present_address.region">
                  {(field) => (
                    <Field>
                      <FieldLabel>Region</FieldLabel>
                      <Input
                        placeholder="Region"
                        value={field.state.value as string}
                        onChange={(e) =>
                          field.handleChange(e.target.value as any)
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="present_address.zip_code">
                  {(field) => (
                    <Field>
                      <FieldLabel>Zip Code</FieldLabel>
                      <Input
                        placeholder="Zip Code"
                        value={field.state.value as string}
                        onChange={(e) =>
                          field.handleChange(e.target.value as any)
                        }
                      />
                    </Field>
                  )}
                </form.Field>
              </div>
            </div>

            {/* Permanent Address */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-sm font-semibold tracking-tight">
                  Permanent Address
                </h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="same-address"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={isSameAddress}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setIsSameAddress(checked)
                      if (checked) {
                        // Bypass validation by setting optional field to undefined
                        form.setFieldValue(
                          "permanent_address",
                          undefined as any
                        )
                      } else {
                        // Restore empty structure for validation when unchecked
                        form.setFieldValue("permanent_address", {
                          full_address: "",
                          street_unit: "",
                          barangay: "",
                          city: "",
                          province: "",
                          region: "",
                          zip_code: "",
                          is_active: true,
                        })
                      }
                    }}
                  />
                  <label
                    htmlFor="same-address"
                    className="cursor-pointer text-sm leading-none font-medium"
                  >
                    Same as present address
                  </label>
                </div>
              </div>

              {/* Hide the fields entirely if they selected "Same as present address" */}
              {!isSameAddress && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3">
                    <form.Field
                      name="permanent_address.full_address"
                      mode="value"
                    >
                      {(field) => (
                        <Field>
                          <FieldLabel>Full Address</FieldLabel>
                          <Input
                            placeholder="Full Address"
                            value={(field.state.value || "") as string}
                            onChange={(e) =>
                              field.handleChange(e.target.value as any)
                            }
                          />
                        </Field>
                      )}
                    </form.Field>
                  </div>

                  <form.Field name="permanent_address.street_unit" mode="value">
                    {(field) => (
                      <Field>
                        <FieldLabel>Street / Unit</FieldLabel>
                        <Input
                          placeholder="Street / Unit"
                          value={(field.state.value || "") as string}
                          onChange={(e) =>
                            field.handleChange(e.target.value as any)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="permanent_address.barangay" mode="value">
                    {(field) => (
                      <Field>
                        <FieldLabel>Barangay</FieldLabel>
                        <Input
                          placeholder="Barangay"
                          value={(field.state.value || "") as string}
                          onChange={(e) =>
                            field.handleChange(e.target.value as any)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="permanent_address.city" mode="value">
                    {(field) => (
                      <Field>
                        <FieldLabel>City</FieldLabel>
                        <Input
                          placeholder="City"
                          value={(field.state.value || "") as string}
                          onChange={(e) =>
                            field.handleChange(e.target.value as any)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="permanent_address.province" mode="value">
                    {(field) => (
                      <Field>
                        <FieldLabel>Province</FieldLabel>
                        <Input
                          placeholder="Province"
                          value={(field.state.value || "") as string}
                          onChange={(e) =>
                            field.handleChange(e.target.value as any)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="permanent_address.region" mode="value">
                    {(field) => (
                      <Field>
                        <FieldLabel>Region</FieldLabel>
                        <Input
                          placeholder="Region"
                          value={(field.state.value || "") as string}
                          onChange={(e) =>
                            field.handleChange(e.target.value as any)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="permanent_address.zip_code" mode="value">
                    {(field) => (
                      <Field>
                        <FieldLabel>Zip Code</FieldLabel>
                        <Input
                          placeholder="Zip Code"
                          value={(field.state.value || "") as string}
                          onChange={(e) =>
                            field.handleChange(e.target.value as any)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Emergency Contacts */}
        <Card className="pt-0">
          <CardHeader className="bg-primary p-2">
            <CardTitle>Emergency Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <form.Field name="emergency_contacts" mode="array">
              {(field) => (
                <div className="mt-4 space-y-4">
                  {field.state.value.map((_, index) => (
                    <div
                      key={index}
                      className="relative flex items-start gap-4 rounded-md border bg-muted/20 p-4"
                    >
                      <div className="grid flex-1 grid-cols-3 gap-4">
                        <form.Field
                          name={`emergency_contacts[${index}].full_name` as any}
                        >
                          {(subField) => (
                            <Field>
                              <FieldLabel>Full Name</FieldLabel>
                              <Input
                                placeholder="Full Name"
                                value={subField.state.value as string}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value as any)
                                }
                              />
                            </Field>
                          )}
                        </form.Field>

                        <form.Field
                          name={
                            `emergency_contacts[${index}].relationship` as any
                          }
                        >
                          {(subField) => (
                            <Field>
                              <FieldLabel>Relationship</FieldLabel>
                              <Input
                                placeholder="e.g., Spouse, Parent"
                                value={subField.state.value as string}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value as any)
                                }
                              />
                            </Field>
                          )}
                        </form.Field>

                        <form.Field
                          name={
                            `emergency_contacts[${index}].mobile_number` as any
                          }
                        >
                          {(subField) => (
                            <Field>
                              <FieldLabel>Mobile Number</FieldLabel>
                              <Input
                                placeholder="09xxxxxxxxx"
                                value={subField.state.value as string}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value as any)
                                }
                              />
                            </Field>
                          )}
                        </form.Field>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-6 text-destructive hover:bg-destructive/10"
                        type="button"
                        onClick={() => field.removeValue(index)}
                        disabled={field.state.value.length === 1} // Enforce minimum of 1 contact
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    className="mt-2"
                    onClick={() =>
                      field.pushValue({
                        full_name: "",
                        relationship: "",
                        mobile_number: "",
                        is_primary: field.state.value.length === 0,
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Emergency Contact
                  </Button>
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Access Controls */}
        <Card className="border-destructive/20 pt-0">
          <CardHeader className="bg-destructive/10 p-2 text-destructive">
            <CardTitle>System Access & Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <form.Field name="account_status">
                {(field) => (
                  <Field>
                    <FieldLabel>Account Status</FieldLabel>
                    <Combobox
                      items={ACCOUNT_STATUS_OPTIONS}
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
                          {ACCOUNT_STATUS_OPTIONS.map((item) => (
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

              <form.Field name="role_id">
                {(field) => (
                  <Field>
                    <FieldLabel>Security Role (Role ID)</FieldLabel>
                    <Input
                      placeholder="e.g. uuid-of-role"
                      value={field.state.value as string}
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
      </CardContent>
    </Card>
  )
}
