"use client"

import { useForm } from "@tanstack/react-form"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { employeeSchema } from "./schemas/employee.schema"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { skuCategorySchema } from "./schemas/sku_category.schema"
import { Textarea } from "@/components/ui/textarea"

export function SkuCategoryForm() {
  const form = useForm({
    defaultValues: {
      category_name: "",
      category_description: "",
    },
    validators: {
      onSubmit: skuCategorySchema,
    },
    onSubmit: async ({ value }) => {
      console.log(value)
    },
  })

  return (
    <>
      <form
        id="sku-category-form"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}

        className="grid grid-cols-3 gap-4"
      >
        <FieldGroup>
          <form.Field
            name="category_name"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Category Name *</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder=""
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </FieldGroup>

        <FieldGroup>
          <form.Field
            name="category_description"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Category Description
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder=""
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </FieldGroup>
      </form>

      <div>
        <Button type="submit" form="sku-category-form">
          Save Category
        </Button>
      </div>
    </>
  )
}
