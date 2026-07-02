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
import { skuCategorySchema } from "./schemas/sku_category.schema"
import { Textarea } from "@/components/ui/textarea"
import { skuUomSchema } from "./schemas/sku_uom.schema"

export function SkuUomForm() {
  const form = useForm({
    defaultValues: {
      uom_name: "",
    },
    validators: {
      onSubmit: skuUomSchema,
    },
    onSubmit: async ({ value }) => {
      console.log(value)
    },
  })

  return (
    <>
      <form
        id="add-emp-form"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}

        className="grid grid-cols-3 gap-4"
      >
        <FieldGroup>
          <form.Field
            name="uom_name"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>UOM Name *</FieldLabel>
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
            name="uom_name"
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
        <Button type="submit" form="sku-uom-form">
          Save UOM
        </Button>
      </div>
    </>
  )
}
