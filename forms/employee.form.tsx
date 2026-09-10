"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Plus, Trash2, Upload, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  BLOOD_TYPE_OPTIONS,
  CIVIL_STATUS_OPTIONS,
  createEmployeeSchema,
  GENDER_OPTIONS,
  ACCOUNT_STATUS_OPTIONS,
  CreateEmployeeFormValues,
} from "./schemas/employee.schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Import queries and actions
import { fetchRoles, type Role } from "./queries/role.query"
import {
  createEmployee,
  getEmployee,
  updateEmployee,
} from "./queries/employee.query"

import {
  regions,
  provinces,
  cities,
  barangays,
  Barangay,
  City,
  Province,
  Region,
} from "select-philippines-address"

// 1. Define base defaults OUTSIDE the component to avoid declaration order and circular dependency issues
const BASE_DEFAULT_VALUES: Partial<CreateEmployeeFormValues> = {
  photo: undefined,
  employee_no: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  maiden_name: "",
  suffix: "",
  nickname: "",
  gender: GENDER_OPTIONS[0],
  civil_status: CIVIL_STATUS_OPTIONS[0],
  date_of_birth: "",
  nationality: "Filipino",
  blood_type: BLOOD_TYPE_OPTIONS[0],
  work_email: "",
  work_phone: "",
  personal_email: "",
  personal_mobile: "",
  account_status: "Active",
  role_id: "",
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
}

export function AllInOneEmployeeForm({
  initialData,
  onSubmitAction,
}: {
  initialData?: Partial<CreateEmployeeFormValues>
  onSubmitAction?: (data: CreateEmployeeFormValues) => Promise<void>
}) {
  const router = useRouter()
  const params = useParams()
  const employeeId = params?.id as string
  const isEditMode = !!employeeId

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSameAddress, setIsSameAddress] = React.useState(false)
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null)

  // Fetching States
  const [roles, setRoles] = React.useState<Role[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = React.useState(true)
  const [isLoadingEmployee, setIsLoadingEmployee] = React.useState(isEditMode)
  const [employeeData, setEmployeeData] = React.useState<
    Partial<CreateEmployeeFormValues>
  >({})

  // Reference for the hidden file input
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // --- ADDRESS CASCADE STATES ---
  const [regionsData, setRegionsData] = React.useState<Region[]>([])
  const regionCodeMap = React.useMemo(
    () => new Map(regionsData.map((r) => [r.region_name, r.region_code])),
    [regionsData]
  )

  // Present Address States
  const [presentProvinces, setPresentProvinces] = React.useState<Province[]>([])
  const [presentCities, setPresentCities] = React.useState<City[]>([])
  const [presentBarangays, setPresentBarangays] = React.useState<Barangay[]>([])

  const presentProvinceCodeMap = React.useMemo(
    () =>
      new Map(presentProvinces.map((p) => [p.province_name, p.province_code])),
    [presentProvinces]
  )
  const presentCityCodeMap = React.useMemo(
    () => new Map(presentCities.map((c) => [c.city_name, c.city_code])),
    [presentCities]
  )

  // Permanent Address States
  const [permanentProvinces, setPermanentProvinces] = React.useState<
    Province[]
  >([])
  const [permanentCities, setPermanentCities] = React.useState<City[]>([])
  const [permanentBarangays, setPermanentBarangays] = React.useState<
    Barangay[]
  >([])

  const permanentProvinceCodeMap = React.useMemo(
    () =>
      new Map(
        permanentProvinces.map((p) => [p.province_name, p.province_code])
      ),
    [permanentProvinces]
  )
  const permanentCityCodeMap = React.useMemo(
    () => new Map(permanentCities.map((c) => [c.city_name, c.city_code])),
    [permanentCities]
  )

  // Fetch Regions on mount
  React.useEffect(() => {
    ;(async () => {
      const data = await regions()
      setRegionsData(data)
    })()
  }, [])

  // Fetch Roles & Employee Data
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoadingRoles(true)
        const fetchedRoles = await fetchRoles()
        setRoles(fetchedRoles || [])
        setIsLoadingRoles(false)

        if (isEditMode) {
          setIsLoadingEmployee(true)
          const data = await getEmployee(employeeId)

          if (data) {
            setEmployeeData({
              ...data,
              role_id: data.role_id ? String(data.role_id) : "",
              present_address:
                data.employee_addresses?.find(
                  (a: any) => a.address_type === "present"
                ) || BASE_DEFAULT_VALUES.present_address,
              permanent_address:
                data.employee_addresses?.find(
                  (a: any) => a.address_type === "permanent"
                ) || BASE_DEFAULT_VALUES.permanent_address,
              emergency_contacts:
                data.employee_emergency_contacts?.length > 0
                  ? data.employee_emergency_contacts
                  : BASE_DEFAULT_VALUES.emergency_contacts,
            })
            if (data.avatar_url) {
              setPhotoPreview(data.avatar_url)
            }
          }
        }
      } catch (error: any) {
        toast.error("Failed to load data: " + error.message)
      } finally {
        setIsLoadingEmployee(false)
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, isEditMode])

  // Hydrate Address Fields for Edit Mode
  React.useEffect(() => {
    if (!employeeData || regionsData.length === 0) return

    async function hydrateAddressCascade(
      address: any,
      setProv: React.Dispatch<React.SetStateAction<Province[]>>,
      setCit: React.Dispatch<React.SetStateAction<City[]>>,
      setBrgy: React.Dispatch<React.SetStateAction<Barangay[]>>
    ) {
      if (!address?.region) return
      const regionCode = regionCodeMap.get(address.region)
      if (!regionCode) return

      const provs = await provinces(regionCode)
      setProv(provs)

      const provinceCode = provs.find(
        (p) => p.province_name === address.province
      )?.province_code
      if (!provinceCode) return

      const cits = await cities(provinceCode)
      setCit(cits)

      const cityCode = cits.find((c) => c.city_name === address.city)?.city_code
      if (!cityCode) return

      const brgys = await barangays(cityCode)
      setBrgy(brgys)
    }

    hydrateAddressCascade(
      employeeData.present_address,
      setPresentProvinces,
      setPresentCities,
      setPresentBarangays
    )

    if (employeeData.permanent_address) {
      hydrateAddressCascade(
        employeeData.permanent_address,
        setPermanentProvinces,
        setPermanentCities,
        setPermanentBarangays
      )
    }
  }, [employeeData, regionsData, regionCodeMap])

  const form = useForm({
    defaultValues: {
      ...BASE_DEFAULT_VALUES,
      ...initialData,
      ...employeeData,
    } as CreateEmployeeFormValues,
    validators: {
      onSubmit: createEmployeeSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true)

        const submissionData = {
          ...value,
          permanent_address: isSameAddress
            ? value.present_address
            : value.permanent_address,
        }

        if (onSubmitAction) {
          await onSubmitAction(submissionData)
        } else {
          if (isEditMode) {
            await updateEmployee(employeeId, submissionData)
            toast.success("Employee updated successfully")
          } else {
            const newEmployee = await createEmployee(submissionData)
            toast.success("Employee created successfully")

            if (newEmployee?.id) {
              router.push(`/d/employees/edit/${newEmployee.id}`)
            }
          }
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to save employee")
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  if (isLoadingEmployee) {
    return (
      <Card className="flex h-64 items-center justify-center border-dashed">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading employee profile...
          </span>
        </div>
      </Card>
    )
  }

  const firstName = form.getFieldValue("first_name") as string
  const lastName = form.getFieldValue("last_name") as string
  const initials =
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "EP"

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
              {/* Photo Upload Section */}
              <div className="col-span-3 mb-6 flex flex-col items-center justify-center">
                <form.Field name={"photo" as any}>
                  {(field) => (
                    <div className="flex flex-col items-center space-y-3">
                      <div
                        className="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/50 transition-colors hover:border-primary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Avatar className="h-full w-full">
                          <AvatarImage
                            src={
                              photoPreview ||
                              (initialData as any)?.photoUrl ||
                              ""
                            }
                          />
                          <AvatarFallback className="text-2xl font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            field.handleChange(file as any)
                            setPhotoPreview(URL.createObjectURL(file))
                          } else {
                            field.handleChange(null as any)
                            setPhotoPreview(null)
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Click to upload profile picture
                      </p>
                      <FieldError errors={field.state.meta.errors} />
                    </div>
                  )}
                </form.Field>
              </div>

              <form.Field name="employee_no">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Employee No. <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      placeholder="EMP-001"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="work_email">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Work Email <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      placeholder="Email"
                      type="email"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="work_phone">
                {(field) => (
                  <Field>
                    <FieldLabel>Work Phone</FieldLabel>
                    <Input
                      placeholder="Phone"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="first_name">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      First Name <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      placeholder="First Name"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="middle_name">
                {(field) => (
                  <Field>
                    <FieldLabel>Middle Name</FieldLabel>
                    <Input
                      placeholder="Middle Name"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="last_name">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Last Name <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      placeholder="Last Name"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="maiden_name">
                {(field) => (
                  <Field>
                    <FieldLabel>Maiden Name</FieldLabel>
                    <Input
                      placeholder="Maiden Name"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="suffix">
                {(field) => (
                  <Field>
                    <FieldLabel>Suffix</FieldLabel>
                    <Input
                      placeholder="Suffix (e.g. Jr, Sr)"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="nickname">
                {(field) => (
                  <Field>
                    <FieldLabel>Nickname</FieldLabel>
                    <Input
                      placeholder="Nickname"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
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
              <form.Field name="gender">
                {(field) => (
                  <Field>
                    <FieldLabel>Gender</FieldLabel>
                    <Select
                      value={(field.state.value as string) || undefined}
                      onValueChange={(val) => field.handleChange(val as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="civil_status">
                {(field) => (
                  <Field>
                    <FieldLabel>Civil Status</FieldLabel>
                    <Select
                      value={(field.state.value as string) || undefined}
                      onValueChange={(val) => field.handleChange(val as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Civil Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {CIVIL_STATUS_OPTIONS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="nationality">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Nationality <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      placeholder="Nationality"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="date_of_birth">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Date Of Birth <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      type="date"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="blood_type">
                {(field) => (
                  <Field>
                    <FieldLabel>Blood Type</FieldLabel>
                    <Select
                      value={(field.state.value as string) || undefined}
                      onValueChange={(val) => field.handleChange(val as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Blood Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_TYPE_OPTIONS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
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
              <form.Field name="personal_email">
                {(field) => (
                  <Field>
                    <FieldLabel>Personal Email</FieldLabel>
                    <Input
                      placeholder="Personal Email"
                      type="email"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="personal_mobile">
                {(field) => (
                  <Field>
                    <FieldLabel>Personal Mobile</FieldLabel>
                    <Input
                      placeholder="Personal Mobile (e.g. 09171234567)"
                      type="text"
                      value={field.state.value as string}
                      onChange={(e) =>
                        field.handleChange(e.target.value as any)
                      }
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
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
                        <FieldLabel>
                          Full Address{" "}
                          <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          placeholder="Full Address"
                          value={field.state.value as string}
                          onChange={(e) =>
                            field.handleChange(e.target.value as any)
                          }
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    )}
                  </form.Field>
                </div>

                <form.Field name="present_address.street_unit">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        Street / Unit{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        placeholder="Street / Unit"
                        value={field.state.value as string}
                        onChange={(e) =>
                          field.handleChange(e.target.value as any)
                        }
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="present_address.region">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        Region <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Select
                        value={(field.state.value as string) || undefined}
                        onValueChange={async (val) => {
                          field.handleChange(val as any)
                          form.setFieldValue("present_address.province", "")
                          form.setFieldValue("present_address.city", "")
                          form.setFieldValue("present_address.barangay", "")

                          const regionCode = regionCodeMap.get(val)
                          if (regionCode) {
                            const p = await provinces(regionCode)
                            setPresentProvinces(p)
                            setPresentCities([])
                            setPresentBarangays([])
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Region" />
                        </SelectTrigger>
                        <SelectContent>
                          {regionsData.map((region) => (
                            <SelectItem
                              key={region.region_name}
                              value={region.region_name}
                            >
                              {region.region_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="present_address.province">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        Province <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Select
                        disabled={!presentProvinces.length}
                        value={(field.state.value as string) || undefined}
                        onValueChange={async (val) => {
                          field.handleChange(val as any)
                          form.setFieldValue("present_address.city", "")
                          form.setFieldValue("present_address.barangay", "")

                          const provCode = presentProvinceCodeMap.get(val)
                          if (provCode) {
                            const c = await cities(provCode)
                            setPresentCities(c)
                            setPresentBarangays([])
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Province" />
                        </SelectTrigger>
                        <SelectContent>
                          {presentProvinces.map((province) => (
                            <SelectItem
                              key={province.province_name}
                              value={province.province_name}
                            >
                              {province.province_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="present_address.city">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        City <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Select
                        disabled={!presentCities.length}
                        value={(field.state.value as string) || undefined}
                        onValueChange={async (val) => {
                          field.handleChange(val as any)
                          form.setFieldValue("present_address.barangay", "")

                          const cityCode = presentCityCodeMap.get(val)
                          if (cityCode) {
                            const b = await barangays(cityCode)
                            setPresentBarangays(b)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select City" />
                        </SelectTrigger>
                        <SelectContent>
                          {presentCities.map((city) => (
                            <SelectItem
                              key={city.city_name}
                              value={city.city_name}
                            >
                              {city.city_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="present_address.barangay">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        Barangay <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Select
                        disabled={!presentBarangays.length}
                        value={(field.state.value as string) || undefined}
                        onValueChange={(val) => field.handleChange(val as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Barangay" />
                        </SelectTrigger>
                        <SelectContent>
                          {presentBarangays.map((brgy) => (
                            <SelectItem
                              key={brgy.brgy_name}
                              value={brgy.brgy_name}
                            >
                              {brgy.brgy_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="present_address.zip_code">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        Zip Code <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        placeholder="Zip Code"
                        value={field.state.value as string}
                        onChange={(e) =>
                          field.handleChange(e.target.value as any)
                        }
                      />
                      <FieldError errors={field.state.meta.errors} />
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
                        form.setFieldValue(
                          "permanent_address",
                          undefined as any
                        )
                      } else {
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

              {!isSameAddress && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3">
                    <form.Field
                      name="permanent_address.full_address"
                      mode="value"
                    >
                      {(field) => (
                        <Field>
                          <FieldLabel>
                            Full Address{" "}
                            <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            placeholder="Full Address"
                            value={(field.state.value || "") as string}
                            onChange={(e) =>
                              field.handleChange(e.target.value as any)
                            }
                          />
                          <FieldError errors={field.state.meta.errors} />
                        </Field>
                      )}
                    </form.Field>
                  </div>

                  <form.Field name="permanent_address.street_unit" mode="value">
                    {(field) => (
                      <Field>
                        <FieldLabel>
                          Street / Unit{" "}
                          <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          placeholder="Street / Unit"
                          value={(field.state.value || "") as string}
                          onChange={(e) =>
                            field.handleChange(e.target.value as any)
                          }
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="permanent_address.region" mode="value">
                    {(field) => (
                      <Field>
                        <FieldLabel>
                          Region <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          value={(field.state.value as string) || undefined}
                          onValueChange={async (val) => {
                            field.handleChange(val as any)
                            form.setFieldValue("permanent_address.province", "")
                            form.setFieldValue("permanent_address.city", "")
                            form.setFieldValue("permanent_address.barangay", "")

                            const regionCode = regionCodeMap.get(val)
                            if (regionCode) {
                              const p = await provinces(regionCode)
                              setPermanentProvinces(p)
                              setPermanentCities([])
                              setPermanentBarangays([])
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Region" />
                          </SelectTrigger>
                          <SelectContent>
                            {regionsData.map((region) => (
                              <SelectItem
                                key={region.region_name}
                                value={region.region_name}
                              >
                                {region.region_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="permanent_address.province" mode="value">
                    {(field) => (
                      <Field>
                        <FieldLabel>
                          Province <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          disabled={!permanentProvinces.length}
                          value={(field.state.value as string) || undefined}
                          onValueChange={async (val) => {
                            field.handleChange(val as any)
                            form.setFieldValue("permanent_address.city", "")
                            form.setFieldValue("permanent_address.barangay", "")

                            const provCode = permanentProvinceCodeMap.get(val)
                            if (provCode) {
                              const c = await cities(provCode)
                              setPermanentCities(c)
                              setPermanentBarangays([])
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Province" />
                          </SelectTrigger>
                          <SelectContent>
                            {permanentProvinces.map((province) => (
                              <SelectItem
                                key={province.province_name}
                                value={province.province_name}
                              >
                                {province.province_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="permanent_address.city" mode="value">
                    {(field) => (
                      <Field>
                        <FieldLabel>
                          City <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          disabled={!permanentCities.length}
                          value={(field.state.value as string) || undefined}
                          onValueChange={async (val) => {
                            field.handleChange(val as any)
                            form.setFieldValue("permanent_address.barangay", "")

                            const cityCode = permanentCityCodeMap.get(val)
                            if (cityCode) {
                              const b = await barangays(cityCode)
                              setPermanentBarangays(b)
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select City" />
                          </SelectTrigger>
                          <SelectContent>
                            {permanentCities.map((city) => (
                              <SelectItem
                                key={city.city_name}
                                value={city.city_name}
                              >
                                {city.city_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="permanent_address.barangay" mode="value">
                    {(field) => (
                      <Field>
                        <FieldLabel>
                          Barangay <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          disabled={!permanentBarangays.length}
                          value={(field.state.value as string) || undefined}
                          onValueChange={(val) =>
                            field.handleChange(val as any)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Barangay" />
                          </SelectTrigger>
                          <SelectContent>
                            {permanentBarangays.map((brgy) => (
                              <SelectItem
                                key={brgy.brgy_name}
                                value={brgy.brgy_name}
                              >
                                {brgy.brgy_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="permanent_address.zip_code" mode="value">
                    {(field) => (
                      <Field>
                        <FieldLabel>
                          Zip Code <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          placeholder="Zip Code"
                          value={(field.state.value || "") as string}
                          onChange={(e) =>
                            field.handleChange(e.target.value as any)
                          }
                        />
                        <FieldError errors={field.state.meta.errors} />
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
                              <FieldLabel>
                                Full Name{" "}
                                <span className="text-destructive">*</span>
                              </FieldLabel>
                              <Input
                                placeholder="Full Name"
                                value={subField.state.value as string}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value as any)
                                }
                              />
                              <FieldError errors={subField.state.meta.errors} />
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
                              <FieldLabel>
                                Relationship{" "}
                                <span className="text-destructive">*</span>
                              </FieldLabel>
                              <Input
                                placeholder="e.g., Spouse, Parent"
                                value={subField.state.value as string}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value as any)
                                }
                              />
                              <FieldError errors={subField.state.meta.errors} />
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
                              <FieldLabel>
                                Mobile Number{" "}
                                <span className="text-destructive">*</span>
                              </FieldLabel>
                              <Input
                                placeholder="09xxxxxxxxx"
                                value={subField.state.value as string}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value as any)
                                }
                              />
                              <FieldError errors={subField.state.meta.errors} />
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

                  <FieldError errors={field.state.meta.errors} />

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
        <Card className="pt-0">
          <CardHeader className="bg-primary p-2">
            <CardTitle>System Access & Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <form.Field name="account_status">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Account Status <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={(field.state.value as string) || undefined}
                      onValueChange={(val) => field.handleChange(val as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_STATUS_OPTIONS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="role_id">
                {(field) => {
                  return (
                    <Field>
                      <FieldLabel>
                        Security Role{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Select
                        disabled={isLoadingRoles}
                        value={(field.state.value as string) || undefined}
                        onValueChange={(val) => field.handleChange(val as any)}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isLoadingRoles
                                ? "Loading roles..."
                                : "Select Role"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem
                              key={role.id}
                              value={role.id.toString()}
                            >
                              {role.role_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )
                }}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            onClick={form.handleSubmit}
            disabled={isSubmitting || isLoadingEmployee}
            className="w-[150px]"
          >
            {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
