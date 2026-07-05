"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams, useRouter } from "next/navigation" // Added useRouter for redirects
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query" // Added useQuery and useQueryClient

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  createSalesGroup,
  getSalesGroup,
  updateSalesGroup,
} from "./queries/sales_group.query"
import { SalesGroupType } from "./queries/sales_group.query"
import { salesGroupSchema } from "./schemas/sales_group.schema"
import {
  createOutlet,
  getOutlet,
  OutletStoreType,
  updateOutlet,
} from "./queries/outlet.query"
import { outletSchema } from "./schemas/outlet.schema"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export function OutletForm() {
  const params = useParams()

  // If your route is /outlet-types/[id], params.id will contain the ID string.
  const id = params?.id as string | undefined
  const isEditMode = !!id

  // 1. Fetch data if in edit mode
  const { data: OutletStoreType, isLoading } = useQuery({
    queryKey: ["outlets", id],
    queryFn: () => getOutlet(id!),
    enabled: isEditMode, // Only run this query if an ID exists
  })

  // 2. Handle mutations conditionally
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof outletSchema>) => {
      if (isEditMode) {
        return updateOutlet({ ...values, id })
      }
      return createOutlet(values)
    },
  })

  // 3. Initialize Form
  const form = useForm({
    // Use 'values' instead of 'defaultValues' so TanStack Form automatically
    // updates when the async data finishes loading from useQuery.
    defaultValues: {
      outlet_code: "",
      outlet_name: "",
      outlet_description: "",
      phone: "",
      email: "",
      is_approved: false,
      is_distributor: false,
      distributor_id: "",
      sales_group_id: "",
      address: "",
      region: "",
      city: "",
      province: "",
      barangay: "",
      country: "",
      zip_code: "", // keep as "" because your schema allows string | number
      outlet_type_id: "",
    },
    validators: {
      onSubmit: outletSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // Handle loading state while fetching existing data
  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading outlet details...
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
      <form.Field name="outlet_code">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Outlet Code
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Team Apple"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="outlet_name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Outlet Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Team Apple"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="outlet_description">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Outlet Description</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Enter Description"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="phone">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Phone
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Team Apple"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="email">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Email
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Team Apple"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="address">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Address</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Enter Description"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="region">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Region
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>

              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
                disabled={mutation.isPending}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                >
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="team-apple">Team Apple</SelectItem>
                  <SelectItem value="team-banana">Team Banana</SelectItem>
                  <SelectItem value="team-orange">Team Orange</SelectItem>
                </SelectContent>
              </Select>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="city">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                City
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>

              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
                disabled={mutation.isPending}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                >
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="team-apple">Team Apple</SelectItem>
                  <SelectItem value="team-banana">Team Banana</SelectItem>
                  <SelectItem value="team-orange">Team Orange</SelectItem>
                </SelectContent>
              </Select>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="province">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Province
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>

              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
                disabled={mutation.isPending}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                >
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="team-apple">Team Apple</SelectItem>
                  <SelectItem value="team-banana">Team Banana</SelectItem>
                  <SelectItem value="team-orange">Team Orange</SelectItem>
                </SelectContent>
              </Select>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="barangay">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Barangay
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>

              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
                disabled={mutation.isPending}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                >
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="team-apple">Team Apple</SelectItem>
                  <SelectItem value="team-banana">Team Banana</SelectItem>
                  <SelectItem value="team-orange">Team Orange</SelectItem>
                </SelectContent>
              </Select>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="country">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Country
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>

              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
                disabled={mutation.isPending}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                >
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="team-apple">Team Apple</SelectItem>
                  <SelectItem value="team-banana">Team Banana</SelectItem>
                  <SelectItem value="team-orange">Team Orange</SelectItem>
                </SelectContent>
              </Select>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="zip_code">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                ZIP Code
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Team Apple"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="distributor_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Distributor
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>

              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
                disabled={mutation.isPending}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                >
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="team-apple">Team Apple</SelectItem>
                  <SelectItem value="team-banana">Team Banana</SelectItem>
                  <SelectItem value="team-orange">Team Orange</SelectItem>
                </SelectContent>
              </Select>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="is_distributor">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(Boolean(checked))
                  }
                  onBlur={field.handleBlur}
                  disabled={mutation.isPending}
                  aria-invalid={isInvalid}
                />

                <FieldLabel htmlFor={field.name} className="cursor-pointer">
                  Mark as Distributor
                  <span className="font-bold text-red-500">*</span>
                </FieldLabel>
              </div>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="is_approved">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(Boolean(checked))
                  }
                  onBlur={field.handleBlur}
                  disabled={mutation.isPending}
                  aria-invalid={isInvalid}
                />

                <FieldLabel htmlFor={field.name} className="cursor-pointer">
                  Approve upon creation
                  <span className="font-bold text-red-500">*</span>
                </FieldLabel>
              </div>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="sales_group_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Sales Group
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>

              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
                disabled={mutation.isPending}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                >
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="team-apple">Team Apple</SelectItem>
                  <SelectItem value="team-banana">Team Banana</SelectItem>
                  <SelectItem value="team-orange">Team Orange</SelectItem>
                </SelectContent>
              </Select>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="outlet_type_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Outlet Type
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>

              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
                disabled={mutation.isPending}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                >
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="team-apple">Team Apple</SelectItem>
                  <SelectItem value="team-banana">Team Banana</SelectItem>
                  <SelectItem value="team-orange">Team Orange</SelectItem>
                </SelectContent>
              </Select>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending
          ? "Saving..."
          : isEditMode
            ? "Update Sales Group"
            : "Create Sales Group"}
      </Button>
    </form>
  )
}
