"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Loader2, Save } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

import { employeeWorkInfoSchema } from "@/forms/schemas/employee_work_info.schema"
import {
  getEmployeeWorkInfo,
  upsertEmployeeWorkInfo,
  searchEmploymentTypes,
  searchEmploymentStatuses,
  searchWorkTypes,
  searchDepartments,
  searchPositions,
} from "@/forms/queries/employee_work_info.query"

export function EmployeeWorkInfoForm() {
  const queryClient = useQueryClient()
  const params = useParams()
  const id = params?.id as string

  // Fetch existing data
  const { data: existingData, isLoading: isLoadingInitial } = useQuery({
    queryKey: ["employee-work-info", id],
    queryFn: () => getEmployeeWorkInfo(id),
    enabled: !!id,
  })

  // Mutations
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof employeeWorkInfoSchema>) =>
      upsertEmployeeWorkInfo(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-work-info", id] })
    },
  })

  // --- Combobox Search States ---
  const [empTypeOpen, setEmpTypeOpen] = React.useState(false)
  const [empTypeSearch, setEmpTypeSearch] = React.useState("")
  const [debouncedEmpType, setDebouncedEmpType] = React.useState("")

  const [empStatusOpen, setEmpStatusOpen] = React.useState(false)
  const [empStatusSearch, setEmpStatusSearch] = React.useState("")
  const [debouncedEmpStatus, setDebouncedEmpStatus] = React.useState("")

  const [workTypeOpen, setWorkTypeOpen] = React.useState(false)
  const [workTypeSearch, setWorkTypeSearch] = React.useState("")
  const [debouncedWorkType, setDebouncedWorkType] = React.useState("")

  const [deptOpen, setDeptOpen] = React.useState(false)
  const [deptSearch, setDeptSearch] = React.useState("")
  const [debouncedDept, setDebouncedDept] = React.useState("")

  const [posOpen, setPosOpen] = React.useState(false)
  const [posSearch, setPosSearch] = React.useState("")
  const [debouncedPos, setDebouncedPos] = React.useState("")

  // --- Debouncers ---
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedEmpType(empTypeSearch), 300)
    return () => clearTimeout(t)
  }, [empTypeSearch])
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedEmpStatus(empStatusSearch), 300)
    return () => clearTimeout(t)
  }, [empStatusSearch])
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedWorkType(workTypeSearch), 300)
    return () => clearTimeout(t)
  }, [workTypeSearch])
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedDept(deptSearch), 300)
    return () => clearTimeout(t)
  }, [deptSearch])
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedPos(posSearch), 300)
    return () => clearTimeout(t)
  }, [posSearch])

  // --- Lookup Queries ---
  const { data: empTypes = [] } = useQuery({
    queryKey: ["lookup-emp-type", debouncedEmpType],
    queryFn: () => searchEmploymentTypes(debouncedEmpType),
  })
  const { data: empStatuses = [] } = useQuery({
    queryKey: ["lookup-emp-status", debouncedEmpStatus],
    queryFn: () => searchEmploymentStatuses(debouncedEmpStatus),
  })
  const { data: workTypes = [] } = useQuery({
    queryKey: ["lookup-work-type", debouncedWorkType],
    queryFn: () => searchWorkTypes(debouncedWorkType),
  })
  const { data: depts = [] } = useQuery({
    queryKey: ["lookup-dept", debouncedDept],
    queryFn: () => searchDepartments(debouncedDept),
  })
  const { data: positions = [] } = useQuery({
    queryKey: ["lookup-pos", debouncedPos],
    queryFn: () => searchPositions(debouncedPos),
  })

  // --- Form Setup ---
  const dv: z.input<typeof employeeWorkInfoSchema> = {
    employee_id: Number(id),
    employment_type_id: existingData?.employment_type_id ?? undefined,
    employment_status_id: existingData?.employment_status_id ?? undefined,
    work_type_id: existingData?.work_type_id ?? "",
    department_id: existingData?.department_id ?? undefined,
    position_id: existingData?.position_id ?? undefined,
    sss_no: existingData?.sss_no ?? "",
    tin_no: existingData?.tin_no ?? "",
    philhealth_no: existingData?.philhealth_no ?? "",
    pagibig_no: existingData?.pagibig_no ?? "",
    emergency_contact_name: existingData?.emergency_contact_name ?? "",
    emergency_contact_no: existingData?.emergency_contact_no ?? "",
    emergency_relation: existingData?.emergency_relation ?? "",
    allow_overtime: existingData?.allow_overtime ?? false,
  }

  const form = useForm({
    defaultValues: dv,
    validators: { onSubmit: employeeWorkInfoSchema },
    onSubmit: async ({ value }) => {
      // Clean up the payload for Postgres bigint columns
      const payload = {
        ...value,
        allow_overtime: value.allow_overtime ?? false,

        // TypeScript knows these are numbers/undefined, so we just check if they exist.
        work_type_id: value.work_type_id ? Number(value.work_type_id) : null,
        employment_type_id: value.employment_type_id
          ? Number(value.employment_type_id)
          : null,
        employment_status_id: value.employment_status_id
          ? Number(value.employment_status_id)
          : null,
        department_id: value.department_id ? Number(value.department_id) : null,
        position_id: value.position_id ? Number(value.position_id) : null,
      }

      mutation.mutate(payload as any)
    },
  })

  // Reload form when data loads
  React.useEffect(() => {
    if (existingData) form.reset(dv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingData])

  if (!id) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Please save the basic employee information first to generate an ID.
      </div>
    )
  }

  if (isLoadingInitial) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
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
      {/* 1. WORK ASSIGNMENT */}
      <Card>
        <CardHeader>
          <CardTitle>Work Assignment</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Department */}
          <form.Field name="department_id">
            {(field) => {
              const selected = depts.find(
                (o) => Number(o.value) === field.state.value
              )
              return (
                <Field>
                  <FieldLabel>Department</FieldLabel>
                  <Popover open={deptOpen} onOpenChange={setDeptOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {selected ? selected.label : "Select department..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search..."
                          value={deptSearch}
                          onValueChange={setDeptSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No departments found.</CommandEmpty>
                          <CommandGroup>
                            {depts.map((o) => (
                              <CommandItem
                                key={o.value}
                                value={o.label}
                                onSelect={() => {
                                  field.handleChange(
                                    Number(o.value) === field.state.value
                                      ? undefined
                                      : Number(o.value)
                                  )
                                  setDeptOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.state.value === Number(o.value)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {o.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )
            }}
          </form.Field>

          {/* Position */}
          <form.Field name="position_id">
            {(field) => {
              const selected = positions.find(
                (o) => Number(o.value) === field.state.value
              )
              return (
                <Field>
                  <FieldLabel>Position</FieldLabel>
                  <Popover open={posOpen} onOpenChange={setPosOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {selected ? selected.label : "Select position..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search..."
                          value={posSearch}
                          onValueChange={setPosSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No positions found.</CommandEmpty>
                          <CommandGroup>
                            {positions.map((o) => (
                              <CommandItem
                                key={o.value}
                                value={o.label}
                                onSelect={() => {
                                  field.handleChange(
                                    Number(o.value) === field.state.value
                                      ? undefined
                                      : Number(o.value)
                                  )
                                  setPosOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.state.value === Number(o.value)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {o.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )
            }}
          </form.Field>

          {/* Employment Type */}
          <form.Field name="employment_type_id">
            {(field) => {
              const selected = empTypes.find(
                (o) => Number(o.value) === field.state.value
              )
              return (
                <Field>
                  <FieldLabel>Employment Type</FieldLabel>
                  <Popover open={empTypeOpen} onOpenChange={setEmpTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {selected ? selected.label : "Select type..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search..."
                          value={empTypeSearch}
                          onValueChange={setEmpTypeSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No types found.</CommandEmpty>
                          <CommandGroup>
                            {empTypes.map((o) => (
                              <CommandItem
                                key={o.value}
                                value={o.label}
                                onSelect={() => {
                                  field.handleChange(
                                    Number(o.value) === field.state.value
                                      ? undefined
                                      : Number(o.value)
                                  )
                                  setEmpTypeOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.state.value === Number(o.value)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {o.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )
            }}
          </form.Field>

          {/* Employment Status */}
          <form.Field name="employment_status_id">
            {(field) => {
              const selected = empStatuses.find(
                (o) => Number(o.value) === field.state.value
              )
              return (
                <Field>
                  <FieldLabel>Employment Status</FieldLabel>
                  <Popover open={empStatusOpen} onOpenChange={setEmpStatusOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {selected ? selected.label : "Select status..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search..."
                          value={empStatusSearch}
                          onValueChange={setEmpStatusSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No statuses found.</CommandEmpty>
                          <CommandGroup>
                            {empStatuses.map((o) => (
                              <CommandItem
                                key={o.value}
                                value={o.label}
                                onSelect={() => {
                                  field.handleChange(
                                    Number(o.value) === field.state.value
                                      ? undefined
                                      : Number(o.value)
                                  )
                                  setEmpStatusOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.state.value === Number(o.value)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {o.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )
            }}
          </form.Field>

          {/* Work Type (UUID based) */}
          <form.Field name="work_type_id">
            {(field) => {
              const selected = workTypes.find(
                (o) => o.value === field.state.value
              )
              return (
                <Field>
                  <FieldLabel>Work Type</FieldLabel>
                  <Popover open={workTypeOpen} onOpenChange={setWorkTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {selected ? selected.label : "Select setup..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search..."
                          value={workTypeSearch}
                          onValueChange={setWorkTypeSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No work types found.</CommandEmpty>
                          <CommandGroup>
                            {workTypes.map((o) => (
                              <CommandItem
                                key={o.value}
                                value={o.label}
                                onSelect={() => {
                                  field.handleChange(
                                    o.value === field.state.value ? "" : o.value
                                  )
                                  setWorkTypeOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.state.value === o.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {o.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )
            }}
          </form.Field>

          {/* Allow Overtime Checkbox */}
          <form.Field name="allow_overtime">
            {(field) => (
              <Field className="mt-8 flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                    className="mt-0.5"
                  />
                  <div className="flex flex-col space-y-1.5 leading-none">
                    <FieldLabel htmlFor={field.name} className="cursor-pointer">
                      Allow Overtime
                    </FieldLabel>
                    <p className="text-xs text-muted-foreground">
                      Employee is eligible to log overtime hours.
                    </p>
                  </div>
                </div>
              </Field>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* 2. GOVERNMENT IDs */}
      <Card>
        <CardHeader>
          <CardTitle>Government Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <form.Field name="sss_no">
            {(field) => (
              <Field>
                <FieldLabel>SSS Number</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="tin_no">
            {(field) => (
              <Field>
                <FieldLabel>TIN Number</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="philhealth_no">
            {(field) => (
              <Field>
                <FieldLabel>PhilHealth Number</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="pagibig_no">
            {(field) => (
              <Field>
                <FieldLabel>Pag-IBIG Number</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* 3. EMERGENCY CONTACT */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <form.Field name="emergency_contact_name">
            {(field) => (
              <Field>
                <FieldLabel>Full Name</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="emergency_relation">
            {(field) => (
              <Field>
                <FieldLabel>Relationship</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g. Spouse"
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="emergency_contact_no">
            {(field) => (
              <Field>
                <FieldLabel>Contact Number</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Work Information
        </Button>
      </div>
    </form>
  )
}
