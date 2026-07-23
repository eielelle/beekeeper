"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

import {
  createLeave,
  getLeave,
  searchEmployeeOptions,
  updateLeave,
} from "./queries/leave.query"
import { leaveSchema } from "./schemas/leave.schema"

export function LeaveForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  const isEditMode = !!editId

  // Employee Combobox & Search States
  const [employeeOpen, setEmployeeOpen] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [debouncedEmployeeSearch, setDebouncedEmployeeSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmployeeSearch(employeeSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [employeeSearch])

  const { data: employeeOptions = [], isLoading: isSearchingEmployees } =
    useQuery({
      queryKey: ["employee-options", debouncedEmployeeSearch],
      queryFn: () => searchEmployeeOptions(debouncedEmployeeSearch),
    })

  // Fetch details if edit mode
  const { data: leaveData, isLoading: isLoadingLeave } = useQuery({
    queryKey: ["leaves", editId],
    queryFn: () => getLeave(editId!),
    enabled: isEditMode,
  })

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof leaveSchema>) => {
      if (isEditMode) {
        return updateLeave({ ...values, id: editId })
      }
      return createLeave(values)
    },
    onSuccess: () => {
      form.reset()
      if (onClose) onClose()
    },
  })

  const form = useForm({
    defaultValues: {
      employee_id: leaveData?.employee_id ?? 0,
      leave_date: leaveData?.leave_date ?? "",
      reason: leaveData?.reason ?? "",
    },
    validators: {
      onSubmit: leaveSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // Populate form when edit data loads
  useEffect(() => {
    if (leaveData) {
      form.reset({
        employee_id: leaveData.employee_id,
        leave_date: leaveData.leave_date,
        reason: leaveData.reason,
      })
    }
  }, [leaveData])

  if (isEditMode && isLoadingLeave) {
    return (
      <div className="flex items-center space-x-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading leave details...</span>
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
      {/* DEBOUNCED SEARCHABLE EMPLOYEE COMBOBOX */}
      <form.Field name="employee_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          const selectedOption = employeeOptions.find(
            (opt) => Number(opt.value) === field.state.value
          )

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Employee <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={employeeOpen}
                    className="w-full justify-between"
                    disabled={mutation.isPending}
                  >
                    {selectedOption
                      ? selectedOption.label
                      : field.state.value
                        ? "Selected Employee"
                        : "Select employee..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Command shouldFilter={false} className="w-full">
                    <CommandInput
                      placeholder="Search by name..."
                      value={employeeSearch}
                      onValueChange={setEmployeeSearch}
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      {isSearchingEmployees && (
                        <div className="flex items-center justify-center space-x-2 p-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Searching...</span>
                        </div>
                      )}
                      {!isSearchingEmployees &&
                        employeeOptions.length === 0 && (
                          <CommandEmpty>No employee found.</CommandEmpty>
                        )}
                      <CommandGroup>
                        {employeeOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              field.handleChange(Number(option.value))
                              setEmployeeOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.state.value === Number(option.value)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* LEAVE DATE */}
      <form.Field name="leave_date">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Leave Date <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                type="date"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* REASON */}
      <form.Field name="reason">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Reason <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Textarea
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Enter leave reason..."
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending
          ? "Saving..."
          : isEditMode
            ? "Update Leave"
            : "Record Leave"}
      </Button>
    </form>
  )
}
