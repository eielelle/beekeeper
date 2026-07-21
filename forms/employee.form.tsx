"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Camera, Info, Loader2, User } from "lucide-react"

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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

// Make sure this path matches where your supabase browser client is located
import { supabase } from "@/lib/supabase"
import { getEmployee, updateEmployee } from "./queries/employee.query"
import { employeeSchema } from "./schemas/employee.schema"

export function EmployeeForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  const queryClient = useQueryClient()
  const params = useParams()
  const router = useRouter()

  let id = params?.id as string | undefined
  if (editId) {
    id = editId
  }
  const isEditMode = !!id

  // Fetch Employee details for edit mode
  const { data: employeeData, isLoading: isLoadingEmployee } = useQuery({
    queryKey: ["employees", id],
    queryFn: () => getEmployee(id!),
    enabled: isEditMode,
  })

  // --- PROFILE PICTURE STATE ---
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)

  // Set initial preview if editing and they already have a picture
  React.useEffect(() => {
    if (employeeData?.avatar_url) {
      setAvatarPreview(employeeData.avatar_url)
    }
  }, [employeeData?.avatar_url])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file)) // Live preview before upload
    }
  }

  // --- MUTATION ---
  const mutation = useMutation({
    mutationFn: async (
      values: z.infer<typeof employeeSchema> & {
        gender?: string
        employment_start?: string
        birthdate?: string
        is_superuser?: boolean
        avatar_url?: string
      }
    ) => {
      let finalAvatarUrl = employeeData?.avatar_url || null

      // 1. UPLOAD IMAGE TO SUPABASE STORAGE (If a new file was selected)
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        const filePath = `avatars/${fileName}`

        // Upload to the "images" bucket
        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, avatarFile)

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`)
        }

        // Get the public URL for the newly uploaded image
        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath)

        finalAvatarUrl = urlData.publicUrl
      }

      // Prepare the payload with the new avatar_url included
      const payload = {
        ...values,
        avatar_url: finalAvatarUrl,
      }

      // 2. SAVE TO DATABASE OR API
      if (isEditMode) {
        return updateEmployee({
          ...payload,
          id,
        })
      } else {
        const formattedDate = payload.birthdate
          ? payload.birthdate.replace(/-/g, "")
          : ""
        const generatedPassword = `${payload.last_name.toLowerCase().replace(/\s+/g, "")}${formattedDate}`

        const apiPayload = {
          ...payload,
          password: generatedPassword,
        }

        const res = await fetch("/api/v1/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiPayload),
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || "Failed to create user account.")
        }

        return await res.json()
      }
    },
    onSuccess: (data) => {
      toast.success(
        isEditMode ? "Employee updated." : "User account created successfully."
      )
      queryClient.invalidateQueries({ queryKey: ["employees"] })

      if (!isEditMode && data?.employee?.id) {
        router.push(`/d/employees/edit/${data.employee.id}/work-information`)
      } else {
        form.reset()
        setAvatarFile(null)
        if (onClose) {
          onClose()
        }
      }
    },
    onError: (error: any) => {
      toast.error(error.message)
    },
  })

  // --- FORM SETUP ---
  const dv = {
    employee_no: employeeData?.employee_no ?? "",
    first_name: employeeData?.first_name ?? "",
    middle_name: employeeData?.middle_name ?? "",
    last_name: employeeData?.last_name ?? "",
    email: employeeData?.email ?? "",
    phone: employeeData?.phone ?? "",
    gender: employeeData?.gender ?? "",
    employment_start: employeeData?.employment_start ?? "",
    birthdate: employeeData?.birthdate ?? "",
    is_superuser: employeeData?.is_superuser ?? false,
  }

  const form = useForm({
    defaultValues: dv,
    validators: {
      onSubmit: employeeSchema as any,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  if (isEditMode && isLoadingEmployee) {
    return (
      <div className="flex items-center space-x-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading employee details...</span>
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
      {/* DEFAULT PASSWORD ALERT BANNER (Create mode only) */}
      {!isEditMode && (
        <form.Subscribe
          selector={(state) => [state.values.last_name, state.values.birthdate]}
        >
          {([lastName, birthdate]) => {
            const formattedDate = birthdate
              ? birthdate.replace(/-/g, "")
              : "YYYYMMDD"
            const exampleName = lastName
              ? lastName.toLowerCase().replace(/\s+/g, "")
              : "cruz"
            const generatedExample = `${exampleName}${formattedDate}`

            return (
              <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-50/50 p-4 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="space-y-1">
                  <p className="font-semibold">Default Password Notice</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    An auth account will be created automatically. The initial
                    password format is{" "}
                    <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-xs font-semibold dark:bg-blue-900 dark:text-blue-100">
                      [lastname][YYYYMMDD]
                    </code>
                    .
                  </p>
                  <p className="text-xs font-medium">
                    Current Password Preview:{" "}
                    <span className="font-mono text-blue-700 dark:text-blue-300">
                      {generatedExample}
                    </span>
                  </p>
                </div>
              </div>
            )
          }}
        </form.Subscribe>
      )}

      {/* PROFILE PICTURE PICKER */}
      <div className="flex flex-col items-center justify-center">
        <div
          className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-muted bg-muted transition-colors hover:border-primary"
          onClick={() => fileInputRef.current?.click()}
        >
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Profile preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-10 w-10 text-muted-foreground" />
          )}
          {/* Hover Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Click to upload photo
        </p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* EMPLOYEE NO */}
        <form.Field name="employee_no">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Employee Number{" "}
                  <span className="font-bold text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="e.g., EMP-001"
                  disabled={mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* EMPLOYMENT START */}
        {!isEditMode && (
          <form.Field name="employment_start">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Start Date{" "}
                    <span className="font-bold text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={mutation.isPending}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* FIRST NAME */}
        <form.Field name="first_name">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  First Name{" "}
                  <span className="font-bold text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Juan"
                  disabled={mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* MIDDLE NAME */}
        <form.Field name="middle_name">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Middle Name</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Dela"
                  disabled={mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* LAST NAME */}
        <form.Field name="last_name">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Last Name{" "}
                  <span className="font-bold text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Cruz"
                  disabled={mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* EMAIL */}
        <form.Field name="email">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Email Address{" "}
                  <span className="font-bold text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="juan@example.com"
                  disabled={mutation.isPending || isEditMode}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* PHONE */}
        <form.Field name="phone">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Phone Number</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="09123456789"
                  disabled={mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* BIRTHDATE */}
        {!isEditMode && (
          <form.Field name="birthdate">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Birthdate{" "}
                    <span className="font-bold text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={mutation.isPending}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>
        )}

        {/* GENDER */}
        {!isEditMode && (
          <form.Field name="gender">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>
                    Gender <span className="font-bold text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val)}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>
        )}

        {/* SUPERUSER CHECKBOX */}
        <form.Field name="is_superuser">
          {(field) => (
            <Field className="flex flex-col gap-2 pt-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                  className="mt-0.5"
                  disabled={mutation.isPending}
                />
                <div className="flex flex-col space-y-1.5 leading-none">
                  <FieldLabel htmlFor={field.name} className="cursor-pointer">
                    Superuser Access
                  </FieldLabel>
                  <p className="text-xs text-muted-foreground">
                    Grants full administrative privileges to this employee.
                  </p>
                </div>
              </div>
            </Field>
          )}
        </form.Field>
      </div>

      {/* SUBMIT BUTTON */}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEditMode ? "Update Employee" : "Create Employee Account"}
        </Button>
      </div>
    </form>
  )
}
