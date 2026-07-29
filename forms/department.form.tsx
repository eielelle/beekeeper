"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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

import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import {
  createDepartment,
  getDepartment,
  updateDepartment,
} from "./queries/department.query"
import { departmentSchema } from "./schemas/department.schema"

// ----------------------------------------------------------------------
// Custom Debounce Hook for the Search Input
// ----------------------------------------------------------------------
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

interface DepartmentFormProps {
  editId?: string
  onClose: () => void
}

export function DepartmentForm({ editId, onClose }: DepartmentFormProps) {
  const isEditMode = Boolean(editId)

  const { data: departmentData, isLoading } = useQuery({
    queryKey: ["departments", editId],
    queryFn: () => getDepartment(editId!),
    enabled: isEditMode,
  })

  if (isEditMode && (isLoading || !departmentData)) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Loading department details...
      </div>
    )
  }

  return (
    <DepartmentFormContent
      key={editId ?? "create"}
      editId={editId}
      departmentData={departmentData}
      onClose={onClose}
    />
  )
}

interface DepartmentFormContentProps extends DepartmentFormProps {
  departmentData?: {
    name: string
    code: string
    department_head_id?: number | string | null
  }
}

function DepartmentFormContent({
  editId,
  departmentData,
  onClose,
}: DepartmentFormContentProps) {
  const queryClient = useQueryClient()
  const isEditMode = Boolean(editId)

  // Combobox State
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Local state to remember the selected user's name (so the UI doesn't lose it when the search clears)
  const [selectedEmpName, setSelectedEmpName] = React.useState<string>("")

  // Server-side search for the Combobox
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employee-search", debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from("employees")
        .select("id, first_name, last_name")
        .order("first_name")
        .limit(50)

      if (debouncedSearch) {
        query = query.or(
          `first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  // Fetch the initial department head (only runs once on mount in edit mode)
  const initialHeadId = departmentData?.department_head_id
  const { data: initialEmployee } = useQuery({
    queryKey: ["employee-single", initialHeadId],
    queryFn: async () => {
      if (!initialHeadId) return null
      const { data } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("id", initialHeadId)
        .single()
      return data
    },
    enabled: !!initialHeadId,
  })

  // Sync the initial loaded employee name to our local state
  React.useEffect(() => {
    if (initialEmployee) {
      setSelectedEmpName(
        `${initialEmployee.first_name} ${initialEmployee.last_name}`
      )
    }
  }, [initialEmployee])

  // Mutation and Form logic
  const mutation = useMutation({
    mutationFn: (
      values: z.infer<typeof departmentSchema> & {
        department_head_id?: string | null
      }
    ) => {
      const payload = {
        ...values,
        department_head_id: values.department_head_id
          ? Number(values.department_head_id)
          : null,
      }

      if (isEditMode && editId) {
        return updateDepartment({ ...payload, id: editId })
      }
      return createDepartment(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ["departments", editId] })
      }
      onClose()
    },
  })

  const form = useForm({
    defaultValues: {
      name: departmentData?.name ?? "",
      code: departmentData?.code ?? "",
      department_head_id: departmentData?.department_head_id
        ? String(departmentData.department_head_id)
        : "",
    },
    validators: {
      onSubmit: departmentSchema as any,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field name="name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Department Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Human Resources"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="code">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Department Code
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., HR"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* DEPARTMENT HEAD COMBOBOX */}
      <form.Field name="department_head_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid} className="flex flex-col gap-2">
              <FieldLabel>Department Head</FieldLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                      "w-full justify-between font-normal",
                      !field.state.value && "text-muted-foreground"
                    )}
                    disabled={mutation.isPending}
                  >
                    {field.state.value && selectedEmpName
                      ? selectedEmpName
                      : "Select department head..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search employees..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingEmployees
                          ? "Searching..."
                          : "No employee found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {field.state.value && (
                          <CommandItem
                            value=""
                            onSelect={() => {
                              field.handleChange("")
                              setSelectedEmpName("")
                              setOpen(false)
                            }}
                            className="text-muted-foreground italic"
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            Clear selection
                          </CommandItem>
                        )}

                        {employees?.map((emp) => (
                          <CommandItem
                            key={emp.id}
                            value={String(emp.id)}
                            onSelect={(currentValue) => {
                              field.handleChange(currentValue)
                              setSelectedEmpName(
                                `${emp.first_name} ${emp.last_name}`
                              )
                              setOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.state.value === String(emp.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {emp.first_name} {emp.last_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
              <p className="mt-1 text-xs text-muted-foreground">
                Optional: Assign a manager to oversee this department.
              </p>
            </Field>
          )
        }}
      </form.Field>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Saving..."
            : isEditMode
              ? "Update Department"
              : "Create Department"}
        </Button>
      </div>
    </form>
  )
}
