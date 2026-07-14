"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState, useEffect, useMemo } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Checkbox } from "@/components/ui/checkbox"

import {
  createOutlet,
  getOutlet,
  searchDistributorOptions,
  updateOutlet,
} from "./queries/outlet.query"
import { searchSalesGroupOptions } from "./queries/sales_group.query"
import { outletSchema } from "./schemas/outlet.schema"

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

// Dynamically load LocationPicker with SSR disabled (required for Leaflet)
const LocationPicker = dynamic(
  () => import("@/components/custom/maps/map-picker"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center rounded-md border border-input bg-muted/20 text-xs text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span>Loading map...</span>
      </div>
    ),
  }
)

export function OutletForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  // Address Cascade States
  const [regionsData, setRegions] = useState<Region[]>([])
  const [provincesData, setProvinces] = useState<Province[]>([])
  const [citiesData, setCities] = useState<City[]>([])
  const [barangaysData, setBarangays] = useState<Barangay[]>([])

  // Geofence Radius State (default 100 meters)
  const [geofenceRadius, setGeofenceRadius] = useState<number>(100)

  // Distributor Combobox & Search States
  const [distributorOpen, setDistributorOpen] = useState(false)
  const [distributorSearch, setDistributorSearch] = useState("")
  const [debouncedDistributorSearch, setDebouncedDistributorSearch] =
    useState("")

  // Sales Group Combobox & Search States
  const [salesGroupOpen, setSalesGroupOpen] = useState(false)
  const [salesGroupSearch, setSalesGroupSearch] = useState("")
  const [debouncedSalesGroupSearch, setDebouncedSalesGroupSearch] = useState("")

  // Handle Distributor search debouncing (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDistributorSearch(distributorSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [distributorSearch])

  // Handle Sales Group search debouncing (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSalesGroupSearch(salesGroupSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [salesGroupSearch])

  // Fetch distributor options with debounced search
  const { data: distributorOptions = [], isLoading: isSearchingDistributors } =
    useQuery({
      queryKey: ["distributor-options", debouncedDistributorSearch],
      queryFn: () => searchDistributorOptions(debouncedDistributorSearch),
    })

  // Fetch sales group options with debounced search
  const { data: salesGroupOptions = [], isLoading: isSearchingSalesGroups } =
    useQuery({
      queryKey: ["sales-group-options", debouncedSalesGroupSearch],
      queryFn: () => searchSalesGroupOptions(debouncedSalesGroupSearch),
    })

  // Lookup maps: maps region/province/city NAMES directly to CODES
  const regionCodeMap = useMemo(
    () => new Map(regionsData.map((r) => [r.region_name, r.region_code])),
    [regionsData]
  )
  const provinceCodeMap = useMemo(
    () => new Map(provincesData.map((p) => [p.province_name, p.province_code])),
    [provincesData]
  )
  const cityCodeMap = useMemo(
    () => new Map(citiesData.map((c) => [c.city_name, c.city_code])),
    [citiesData]
  )

  async function fetchRegions() {
    const data = await regions()
    setRegions(data)
  }

  async function fetchProvinces(regionCode: string) {
    const data = await provinces(regionCode)
    setProvinces(data)
    setCities([])
    setBarangays([])
  }

  async function fetchCities(provinceCode: string) {
    const data = await cities(provinceCode)
    setCities(data)
    setBarangays([])
  }

  async function fetchBarangays(cityCode: string) {
    const data = await barangays(cityCode)
    setBarangays(data)
  }

  // Load initial region list on mount once
  useEffect(() => {
    ;(async () => {
      await fetchRegions()
    })()
  }, [])

  const params = useParams()
  let id = params?.id as string | undefined
  if (editId) {
    id = editId
  }
  const isEditMode = !!id

  // Fetch Outlet details for edit mode
  const { data: outletData, isLoading: isLoadingOutlet } = useQuery({
    queryKey: ["outlets", id],
    queryFn: () => getOutlet(id!),
    enabled: isEditMode,
  })

  useEffect(() => {
    if (!outletData || regionsData.length === 0) return

    async function initialize() {
      // load province list
      const regionCode = regionCodeMap.get(outletData.region)

      if (regionCode) {
        const provs = await provinces(regionCode)
        setProvinces(provs)

        // load city list
        const provinceCode = provs.find(
          (p) => p.province_name === outletData.province
        )?.province_code

        if (provinceCode) {
          const cityList = await cities(provinceCode)
          setCities(cityList)

          // load barangays
          const cityCode = cityList.find(
            (c) => c.city_name === outletData.city
          )?.city_code

          if (cityCode) {
            const brgys = await barangays(cityCode)
            setBarangays(brgys)
          }
        }
      }

      // NOW populate form
      form.reset({
        outlet_code: outletData.outlet_code,
        outlet_name: outletData.outlet_name,
        sales_group_id: outletData.sales_group_id,
        address: outletData.address,
        region: outletData.region,
        province: outletData.province,
        city: outletData.city,
        barangay: outletData.barangay,
        distributor_id: outletData.distributor_id,
        is_distributor: outletData.is_distributor,
        is_active: outletData.is_active,
        lat: outletData.lat,
        long: outletData.long,
        geofence_radius: outletData.geofenceRadius,
      })

      setGeofenceRadius(outletData.geofenceRadius)
    }

    initialize()
  }, [outletData, regionsData])

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof outletSchema>) => {
      if (isEditMode) {
        return updateOutlet({
          ...values,
          id,
        })
      }
      return createOutlet(values)
    },
    onSuccess: () => {
      form.reset()
      setProvinces([])
      setCities([])
      setBarangays([])
      if (onClose) {
        onClose()
      }
    },
  })

  const dv: z.input<typeof outletSchema> = {
    outlet_code: outletData?.outlet_code ?? "",
    outlet_name: outletData?.outlet_name ?? "",
    sales_group_id: outletData?.sales_group_id ?? undefined,
    address: outletData?.address ?? "",
    region: outletData?.region ?? "",
    province: outletData?.province ?? "",
    city: outletData?.city ?? "",
    barangay: outletData?.barangay ?? "",
    distributor_id: outletData?.distributor_id ?? undefined,
    is_distributor: outletData?.is_distributor ?? false,
    is_active: outletData?.is_active ?? true,
    lat: outletData?.lat ?? 0,
    long: outletData?.long ?? 0,
    geofence_radius: outletData?.geofenceRadius ?? 0,
  }

  const form = useForm({
    defaultValues: dv,
    validators: {
      onSubmit: outletSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  if (isEditMode && isLoadingOutlet) {
    return (
      <div className="flex items-center space-x-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading outlet details...</span>
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
      {/* OUTLET CODE */}
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
                placeholder="e.g., Office Supplies"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* OUTLET NAME */}
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
                placeholder="e.g., Office Supplies"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* DEBOUNCED SEARCHABLE SALES GROUP COMBOBOX */}
      <form.Field name="sales_group_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          const selectedOption = salesGroupOptions.find(
            (opt) => Number(opt.value) === field.state.value
          )

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Sales Group</FieldLabel>
              <Popover open={salesGroupOpen} onOpenChange={setSalesGroupOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={salesGroupOpen}
                    className="w-full justify-between"
                    disabled={mutation.isPending}
                  >
                    {selectedOption
                      ? selectedOption.label
                      : field.state.value
                        ? "Selected Sales Group"
                        : "Select sales group..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Command shouldFilter={false} className="w-full">
                    <CommandInput
                      placeholder="Search sales group..."
                      value={salesGroupSearch}
                      onValueChange={setSalesGroupSearch}
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      {isSearchingSalesGroups && (
                        <div className="flex items-center justify-center space-x-2 p-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Searching...</span>
                        </div>
                      )}
                      {!isSearchingSalesGroups &&
                        salesGroupOptions.length === 0 && (
                          <CommandEmpty>No sales group found.</CommandEmpty>
                        )}
                      <CommandGroup>
                        {salesGroupOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              field.handleChange(
                                Number(option.value) === field.state.value
                                  ? undefined
                                  : Number(option.value)
                              )
                              setSalesGroupOpen(false)
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

      {/* DEBOUNCED SEARCHABLE DISTRIBUTOR COMBOBOX */}
      <form.Field name="distributor_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          const selectedOption = distributorOptions.find(
            (opt) => Number(opt.value) === field.state.value
          )

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Distributor</FieldLabel>
              <Popover open={distributorOpen} onOpenChange={setDistributorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={distributorOpen}
                    className="w-full justify-between"
                    disabled={mutation.isPending}
                  >
                    {selectedOption
                      ? selectedOption.label
                      : field.state.value
                        ? "Selected Distributor"
                        : "Select distributor..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Command shouldFilter={false} className="w-full">
                    <CommandInput
                      placeholder="Search distributor outlet..."
                      value={distributorSearch}
                      onValueChange={setDistributorSearch}
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      {isSearchingDistributors && (
                        <div className="flex items-center justify-center space-x-2 p-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Searching...</span>
                        </div>
                      )}
                      {!isSearchingDistributors &&
                        distributorOptions.length === 0 && (
                          <CommandEmpty>No distributor found.</CommandEmpty>
                        )}
                      <CommandGroup>
                        {distributorOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              field.handleChange(
                                option.value ? Number(option.value) : undefined
                              )
                              setDistributorOpen(false)
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

      {/* ADDRESS */}
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
                placeholder="Enter description details here..."
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* REGION SELECT */}
      <form.Field name="region">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Region</FieldLabel>

              <Select
                value={field.state.value}
                onValueChange={async (regionName) => {
                  field.handleChange(regionName)

                  // Reset lower form fields
                  form.setFieldValue("province", "")
                  form.setFieldValue("city", "")
                  form.setFieldValue("barangay", "")

                  const regionCode = regionCodeMap.get(regionName)
                  if (regionCode) {
                    await fetchProvinces(regionCode)
                  }
                }}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select a region" />
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

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* PROVINCE SELECT */}
      <form.Field name="province">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Province</FieldLabel>

              <Select
                value={field.state.value}
                disabled={!provincesData.length}
                onValueChange={async (provinceName) => {
                  field.handleChange(provinceName)

                  form.setFieldValue("city", "")
                  form.setFieldValue("barangay", "")

                  const provinceCode = provinceCodeMap.get(provinceName)
                  if (provinceCode) {
                    await fetchCities(provinceCode)
                  }
                }}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select a province" />
                </SelectTrigger>

                <SelectContent>
                  {provincesData.map((province) => (
                    <SelectItem
                      key={province.province_name}
                      value={province.province_name}
                    >
                      {province.province_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* CITY SELECT */}
      <form.Field name="city">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>City</FieldLabel>

              <Select
                value={field.state.value}
                disabled={!citiesData.length}
                onValueChange={async (cityName) => {
                  field.handleChange(cityName)

                  form.setFieldValue("barangay", "")

                  const cityCode = cityCodeMap.get(cityName)
                  if (cityCode) {
                    await fetchBarangays(cityCode)
                  }
                }}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>

                <SelectContent>
                  {citiesData.map((city) => (
                    <SelectItem key={city.city_name} value={city.city_name}>
                      {city.city_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* BARANGAY SELECT */}
      <form.Field name="barangay">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Barangay</FieldLabel>

              <Select
                value={field.state.value}
                disabled={!barangaysData.length}
                onValueChange={(brgyName) => {
                  field.handleChange(brgyName)
                }}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select a barangay" />
                </SelectTrigger>

                <SelectContent>
                  {barangaysData.map((brgy) => (
                    <SelectItem key={brgy.brgy_name} value={brgy.brgy_name}>
                      {brgy.brgy_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* MAP LOCATION PICKER & LAT/LONG INPUTS */}
      <div className="space-y-3">
        <FieldLabel>Pin Outlet Location</FieldLabel>

        <form.Subscribe
          selector={(state) => [state.values.lat, state.values.long]}
        >
          {([lat, long]) => (
            <LocationPicker
              lat={lat}
              long={long}
              radius={geofenceRadius}
              onChange={({ lat: newLat, long: newLong }) => {
                form.setFieldValue("lat", Number(newLat.toFixed(6)))
                form.setFieldValue("long", Number(newLong.toFixed(6)))
              }}
              onRadiusChange={(newRadius) => {
                setGeofenceRadius(newRadius)
                form.setFieldValue(
                  "geofence_radius",
                  Number(geofenceRadius.toFixed(6))
                )
              }}
            />
          )}
        </form.Subscribe>

        <div className="grid grid-cols-2 gap-4">
          <form.Field name="lat">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Latitude</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    step="any"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    aria-invalid={isInvalid}
                    disabled={mutation.isPending}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="long">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Longitude</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    step="any"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    aria-invalid={isInvalid}
                    disabled={mutation.isPending}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>
        </div>
      </div>

      {/* IS DISTRIBUTOR */}
      <form.Field name="is_distributor">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={field.name}
                  name={field.name}
                  checked={!!field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  disabled={mutation.isPending}
                />
                <FieldLabel htmlFor={field.name} className="cursor-pointer">
                  Set as Distributor
                </FieldLabel>
              </div>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* IS ACTIVE */}
      <form.Field name="is_active">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={field.name}
                  name={field.name}
                  checked={!!field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  disabled={mutation.isPending}
                />
                <FieldLabel htmlFor={field.name} className="cursor-pointer">
                  Set as Active
                </FieldLabel>
              </div>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* SUBMIT BUTTON */}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending
          ? "Saving..."
          : isEditMode
            ? "Update Outlet"
            : "Create Outlet"}
      </Button>
    </form>
  )
}
