"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

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
  approvalRuleSchema,
  type ApprovalRuleFormValues,
} from "./schemas/approval-rule.schema"
import { fetchRoles, createApprovalRule } from "./queries/approval-rule.query"
import { useCurrentEmployee } from "@/hooks/use-current-employee"

const MODULES = [
  { value: "sales_booking", label: "Sales Booking" },
  { value: "leaves", label: "Leave Request" },
  { value: "expenses", label: "Expense Report" },
  { value: "bad_orders", label: "Bad Orders (BO)" },
]

export function ApprovalRuleForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const { employee } = useCurrentEmployee()

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  })

  const mutation = useMutation({
    mutationFn: (values: ApprovalRuleFormValues) =>
      createApprovalRule({
        values,
        orgId: employee!.org_id,
      }),
    onSuccess: () => {
      toast.success("Approval rule created successfully!")
      queryClient.invalidateQueries({ queryKey: ["approval_rules"] })
      form.reset()
      onSuccess()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // ✅ Correct
  const form = useForm({
    defaultValues: {
      module: "",
      step_level: 1,
      role_id: "",
    } as ApprovalRuleFormValues, // Casting here is enough for TS to infer everything!
    validators: {
      onSubmit: approvalRuleSchema,
    },
    onSubmit: async ({ value }) => {
      if (!employee?.org_id) {
        toast.error("Organization context missing.")
        return
      }
      mutation.mutate(value)
    },
  })

  return (
    <form
      className="flex flex-col space-y-6 pt-4"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field name="module">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel>
                Target Module <span className="text-destructive">*</span>
              </FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
                disabled={mutation.isPending}
              >
                <SelectTrigger aria-invalid={isInvalid}>
                  <SelectValue placeholder="Select which module this rule applies to" />
                </SelectTrigger>
                <SelectContent>
                  {MODULES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="step_level">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel>
                Step Level <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                type="number"
                min={1}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                disabled={mutation.isPending}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Level 1 is the first approver. Level 2 happens after Level 1
                approves, etc.
              </p>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="role_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel>
                Approver Role <span className="text-destructive">*</span>
              </FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
                disabled={isLoadingRoles || mutation.isPending}
              >
                <SelectTrigger aria-invalid={isInvalid}>
                  <SelectValue placeholder="Select required role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id.toString()}>
                      {r.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Rule
        </Button>
      </div>
    </form>
  )
}
