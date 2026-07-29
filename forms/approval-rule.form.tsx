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
import {
  fetchRoles,
  fetchDepartmentsForRule,
  createApprovalRule,
} from "./queries/approval-rule.query"
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

  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["departments-for-rules"],
    queryFn: fetchDepartmentsForRule,
  })

  const mutation = useMutation({
    mutationFn: (values: ApprovalRuleFormValues) =>
      createApprovalRule({ values, orgId: employee!.org_id }),
    onSuccess: () => {
      toast.success("Approval rule created successfully!")
      queryClient.invalidateQueries({ queryKey: ["approval_rules"] })
      form.reset()
      onSuccess()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const form = useForm({
    defaultValues: {
      module: "",
      step_level: 1,
      routing_mode: "role",
      role_id: "",
      department_id: "",
    } as ApprovalRuleFormValues,
    validators: { onSubmit: approvalRuleSchema },
    onSubmit: async ({ value }) => {
      if (!employee?.org_id) return toast.error("Organization context missing.")
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
      {/* Target Module */}
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
                  <SelectValue placeholder="Select module" />
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

      {/* Step Level */}
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
                Level 1 is the first approver.
              </p>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* Routing Mode */}
      <form.Field name="routing_mode">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel>
                Routing Mode <span className="text-destructive">*</span>
              </FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(val) => {
                  field.handleChange(
                    val as "role" | "requester_dept" | "specific_dept"
                  )
                  form.setFieldValue("role_id", "")
                  form.setFieldValue("department_id", "")
                }}
                disabled={mutation.isPending}
              >
                <SelectTrigger aria-invalid={isInvalid}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">
                    Fixed Role (e.g., General Manager)
                  </SelectItem>
                  <SelectItem value="requester_dept">
                    Dynamic: Requester's Dept. Head
                  </SelectItem>
                  <SelectItem value="specific_dept">
                    Specific Department's Head
                  </SelectItem>
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* Conditional Rendering: Role OR Department Dropdowns */}
      <form.Subscribe selector={(state) => state.values.routing_mode}>
        {(routingMode) => (
          <>
            {routingMode === "role" && (
              <form.Field name="role_id">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field
                      data-invalid={isInvalid}
                      className="animate-in fade-in slide-in-from-top-2"
                    >
                      <FieldLabel>
                        Approver Role{" "}
                        <span className="text-destructive">*</span>
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
                          {roles.map((r: any) => (
                            <SelectItem key={r.id} value={r.id.toString()}>
                              {r.role_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>
            )}

            {routingMode === "specific_dept" && (
              <form.Field name="department_id">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field
                      data-invalid={isInvalid}
                      className="animate-in fade-in slide-in-from-top-2"
                    >
                      <FieldLabel>
                        Target Department{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                        disabled={isLoadingDepts || mutation.isPending}
                      >
                        <SelectTrigger aria-invalid={isInvalid}>
                          <SelectValue placeholder="Select required department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((d: any) => (
                            <SelectItem key={d.id} value={d.id.toString()}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>
            )}
          </>
        )}
      </form.Subscribe>

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
