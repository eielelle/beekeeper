"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Save,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  ListChecks,
  Globe,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import {
  regions,
  provinces,
  cities,
  Region,
  Province,
  City,
} from "select-philippines-address"

// Queries
import { fetchOutlets, OutletStoreType } from "@/forms/queries/outlet.query"
import { searchEmployeeOptions } from "@/forms/queries/employee.query"
import {
  getAssignedOutlets,
  getOutletsByIds,
  assignOutletsToEmployee,
} from "@/forms/queries/employee-outlet.query"

export default function OutletAssignmentPage() {
  const queryClient = useQueryClient()

  // --- Employee Selection State ---
  const [employeeOpen, setEmployeeOpen] = React.useState(false)
  const [employeeSearch, setEmployeeSearch] = React.useState("")
  const [debouncedEmpSearch, setDebouncedEmpSearch] = React.useState("")
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<
    string | undefined
  >()

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedEmpSearch(employeeSearch), 300)
    return () => clearTimeout(timer)
  }, [employeeSearch])

  const { data: employeeOptions = [], isLoading: isSearchingEmployees } =
    useQuery({
      queryKey: ["employee-options", debouncedEmpSearch],
      queryFn: () => searchEmployeeOptions(debouncedEmpSearch),
    })

  // --- Cascading Address State ---
  const [regionsData, setRegionsData] = React.useState<Region[]>([])
  const [provincesData, setProvincesData] = React.useState<Province[]>([])
  const [citiesData, setCitiesData] = React.useState<City[]>([])

  const regionCodeMap = React.useMemo(
    () => new Map(regionsData.map((r) => [r.region_name, r.region_code])),
    [regionsData]
  )
  const provinceCodeMap = React.useMemo(
    () => new Map(provincesData.map((p) => [p.province_name, p.province_code])),
    [provincesData]
  )

  React.useEffect(() => {
    ;(async () => {
      const data = await regions()
      setRegionsData(data)
    })()
  }, [])

  // --- View Mode & Core State ---
  const [viewMode, setViewMode] = React.useState<"all" | "assigned">("all")
  const [pageIndex, setPageIndex] = React.useState(0)
  const pageSize = 10

  // Lightweight Record holding ONLY the IDs { "1": true, "2": true }
  const [selectedOutlets, setSelectedOutlets] = React.useState<
    Record<string, boolean>
  >({})

  const selectedIdsArray = React.useMemo(
    () => Object.keys(selectedOutlets).filter((id) => selectedOutlets[id]),
    [selectedOutlets]
  )

  // Fetch initial assigned IDs
  const { data: assignedIdsData } = useQuery({
    queryKey: ["assigned-outlets", selectedEmployeeId],
    queryFn: async () => {
      if (!selectedEmployeeId) return {}
      const assignedIds = await getAssignedOutlets(selectedEmployeeId)
      const initialSelection: Record<string, boolean> = {}
      assignedIds.forEach((id) => (initialSelection[id] = true))
      return initialSelection
    },
    enabled: !!selectedEmployeeId,
  })

  // Sync fetch to local state safely
  React.useEffect(() => {
    if (assignedIdsData) {
      setSelectedOutlets(assignedIdsData)
    } else {
      setSelectedOutlets({})
    }
  }, [assignedIdsData, selectedEmployeeId])

  // --- Filter State ---
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [appliedFilters, setAppliedFilters] = React.useState({
    type: "",
    region: "",
    province: "",
    city: "",
  })
  const [draftFilters, setDraftFilters] = React.useState(appliedFilters)

  React.useEffect(() => {
    if (isFilterOpen) setDraftFilters(appliedFilters)
  }, [isFilterOpen, appliedFilters])

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters)
    setPageIndex(0)
    setIsFilterOpen(false)
    setViewMode("all") // If they filter, jump back to All view
  }

  const handleClearFilters = () => {
    setAppliedFilters({ type: "", region: "", province: "", city: "" })
    setDraftFilters({ type: "", region: "", province: "", city: "" })
    setProvincesData([])
    setCitiesData([])
    setPageIndex(0)
    setIsFilterOpen(false)
  }

  const removeFilter = (key: keyof typeof appliedFilters) => {
    setAppliedFilters((prev) => ({ ...prev, [key]: "" }))
    setPageIndex(0)
  }

  // --- Data Fetching: ALL Mode ---
  const { data: allOutletsData, isLoading: isLoadingAll } = useQuery({
    queryKey: [
      "outlets-assignment-all",
      pageIndex,
      pageSize,
      globalFilter,
      appliedFilters,
    ],
    queryFn: () =>
      fetchOutlets({
        pageIndex,
        pageSize,
        globalFilter,
        distributorFilter: appliedFilters.type || "all",
        region: appliedFilters.region || undefined,
        province: appliedFilters.province || undefined,
        city: appliedFilters.city || undefined,
      }),
    enabled: viewMode === "all" && !!selectedEmployeeId,
  })

  // --- Data Fetching: ASSIGNED Mode (Local Chunking) ---
  const { data: assignedChunkData, isLoading: isLoadingAssignedChunk } =
    useQuery({
      queryKey: [
        "outlets-assignment-chunk",
        selectedIdsArray,
        pageIndex,
        pageSize,
      ],
      queryFn: async () => {
        // Grab just the 10 IDs needed for the current page
        const chunkIds = selectedIdsArray.slice(
          pageIndex * pageSize,
          (pageIndex + 1) * pageSize
        )
        if (chunkIds.length === 0) return []
        return getOutletsByIds(chunkIds)
      },
      enabled: viewMode === "assigned" && !!selectedEmployeeId,
    })

  // Determine what is currently visible on the table based on the tab
  const displayOutlets = React.useMemo(() => {
    if (viewMode === "assigned") {
      return (assignedChunkData as OutletStoreType[]) || []
    }
    return (allOutletsData?.data as OutletStoreType[]) || []
  }, [viewMode, assignedChunkData, allOutletsData])

  const currentTotalCount =
    viewMode === "assigned"
      ? selectedIdsArray.length
      : (allOutletsData?.rowCount ?? 0)
  const totalPages = Math.ceil(currentTotalCount / pageSize)
  const isTableLoading =
    viewMode === "assigned" ? isLoadingAssignedChunk : isLoadingAll

  // --- Checkbox Handlers ---
  const toggleRow = (id: string, checked: boolean) => {
    setSelectedOutlets((prev) => {
      const next = { ...prev }
      if (checked) next[id] = true
      else delete next[id]
      return next
    })
  }

  const toggleAllOnPage = (checked: boolean) => {
    setSelectedOutlets((prev) => {
      const next = { ...prev }
      displayOutlets.forEach((outlet) => {
        if (!outlet.id) return
        if (checked) next[outlet.id] = true
        else delete next[outlet.id]
      })
      return next
    })
  }

  const isAllPageSelected =
    displayOutlets.length > 0 &&
    displayOutlets.every((outlet) => outlet.id && selectedOutlets[outlet.id])
  const isSomePageSelected =
    displayOutlets.some((outlet) => outlet.id && selectedOutlets[outlet.id]) &&
    !isAllPageSelected

  // --- Mutation ---
  const assignMutation = useMutation({
    mutationFn: () => {
      if (!selectedEmployeeId) throw new Error("No employee selected")
      return assignOutletsToEmployee({
        employeeId: selectedEmployeeId,
        outletIds: selectedIdsArray,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["assigned-outlets", selectedEmployeeId],
      })
    },
  })

  const selectedEmployeeName = employeeOptions.find(
    (opt) => opt.value === selectedEmployeeId
  )?.label
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-tight">
            Outlet Assignment
          </h2>
          <p className="text-xs text-muted-foreground">
            Assign geographical territories and outlets to field personnel.
          </p>
        </div>
        <Button
          onClick={() => assignMutation.mutate()}
          disabled={!selectedEmployeeId || assignMutation.isPending}
          size={"sm"}
        >
          {assignMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Assignments
        </Button>
      </div>

      {/* 1. EMPLOYEE SELECTOR */}
      <Card>
        <CardHeader>
          <CardTitle>1. Select Employee</CardTitle>
          <CardDescription>
            Choose the employee you want to assign outlets to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={employeeOpen}
                className="w-[300px] justify-between"
              >
                {selectedEmployeeName || "Search employee..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search employee by name/ID..."
                  value={employeeSearch}
                  onValueChange={setEmployeeSearch}
                />
                <CommandList>
                  {isSearchingEmployees && (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!isSearchingEmployees && employeeOptions.length === 0 && (
                    <CommandEmpty>No employees found.</CommandEmpty>
                  )}
                  <CommandGroup>
                    {employeeOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => {
                          setSelectedEmployeeId(option.value)
                          setEmployeeOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedEmployeeId === option.value
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
        </CardContent>
      </Card>

      {/* 2. OUTLET TABLE WITH FILTERS & VIEW MODE */}
      <Card
        className={cn(
          "transition-opacity",
          !selectedEmployeeId && "pointer-events-none opacity-50"
        )}
      >
        <CardHeader className="flex flex-col gap-4 border-b pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>2. Manage Assignments</CardTitle>
            <CardDescription>
              {selectedEmployeeId
                ? `Currently managing territory for ${selectedEmployeeName}.`
                : "Select an employee above to manage their outlets."}
            </CardDescription>
          </div>

          {/* VIEW MODE TOGGLE */}
          <div className="flex rounded-lg border bg-muted/50 p-1">
            <Button
              variant={viewMode === "all" ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 text-xs", viewMode === "all" && "shadow-sm")}
              onClick={() => {
                setViewMode("all")
                setPageIndex(0)
              }}
            >
              <Globe className="mr-2 h-3.5 w-3.5" />
              All Outlets
            </Button>
            <Button
              variant={viewMode === "assigned" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-8 text-xs",
                viewMode === "assigned" && "shadow-sm"
              )}
              onClick={() => {
                setViewMode("assigned")
                setPageIndex(0)
              }}
            >
              <ListChecks className="mr-2 h-3.5 w-3.5" />
              Assigned ({selectedIdsArray.length})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Filters & Search Toolbar (Only visible in 'All' mode) */}
          {viewMode === "all" && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search outlets by code or name..."
                  value={globalFilter}
                  onChange={(e) => {
                    setGlobalFilter(e.target.value)
                    setPageIndex(0)
                  }}
                  className="pl-9 text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-1 rounded-full px-1.5 py-0.5 text-xs"
                        >
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="flex w-[350px] flex-col sm:w-[450px]">
                    <SheetHeader>
                      <SheetTitle>Filter Outlets</SheetTitle>
                      <SheetDescription>
                        Narrow down available geographic locations.
                      </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4 overflow-y-auto p-4">
                      {/* TYPE */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium">
                          Outlet Type
                        </label>
                        <Select
                          value={draftFilters.type}
                          onValueChange={(val) =>
                            setDraftFilters((p) => ({
                              ...p,
                              type: val === "all" ? "" : val,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="distributors">
                              Distributors
                            </SelectItem>
                            <SelectItem value="no_distributor">
                              No Distributor
                            </SelectItem>
                            <SelectItem value="has_distributor">
                              Has Distributor
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* REGION */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium">Region</label>
                        <Select
                          value={draftFilters.region}
                          onValueChange={async (val) => {
                            setDraftFilters((p) => ({
                              ...p,
                              region: val === "all" ? "" : val,
                              province: "",
                              city: "",
                            }))
                            if (val !== "all") {
                              const code = regionCodeMap.get(val)
                              if (code) setProvincesData(await provinces(code))
                            } else {
                              setProvincesData([])
                            }
                            setCitiesData([])
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Regions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Regions</SelectItem>
                            {regionsData.map((r) => (
                              <SelectItem
                                key={r.region_code}
                                value={r.region_name}
                              >
                                {r.region_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* PROVINCE */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium">Province</label>
                        <Select
                          value={draftFilters.province}
                          disabled={
                            !draftFilters.region || provincesData.length === 0
                          }
                          onValueChange={async (val) => {
                            setDraftFilters((p) => ({
                              ...p,
                              province: val === "all" ? "" : val,
                              city: "",
                            }))
                            if (val !== "all") {
                              const code = provinceCodeMap.get(val)
                              if (code) setCitiesData(await cities(code))
                            } else {
                              setCitiesData([])
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Provinces" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Provinces</SelectItem>
                            {provincesData.map((p) => (
                              <SelectItem
                                key={p.province_code}
                                value={p.province_name}
                              >
                                {p.province_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* CITY */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium">City</label>
                        <Select
                          value={draftFilters.city}
                          disabled={
                            !draftFilters.province || citiesData.length === 0
                          }
                          onValueChange={(val) =>
                            setDraftFilters((p) => ({
                              ...p,
                              city: val === "all" ? "" : val,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Cities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Cities</SelectItem>
                            {citiesData.map((c) => (
                              <SelectItem key={c.city_code} value={c.city_name}>
                                {c.city_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <SheetFooter>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={handleClearFilters}>
                          Reset
                        </Button>
                        <Button onClick={handleApplyFilters}>
                          Apply Filters
                        </Button>
                      </div>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          )}

          {/* Active Filters Inline Tags */}
          {viewMode === "all" && activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(appliedFilters).map(([key, val]) => {
                if (!val) return null
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <span className="capitalize">{key}:</span> {val}
                    <button
                      type="button"
                      className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20 focus:outline-none"
                      onClick={() =>
                        removeFilter(key as keyof typeof appliedFilters)
                      }
                    >
                      <X className="h-3 w-3 text-secondary-foreground" />
                    </button>
                  </Badge>
                )
              })}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={handleClearFilters}
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Native Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        isAllPageSelected ||
                        (isSomePageSelected ? "indeterminate" : false)
                      }
                      onCheckedChange={(val) => toggleAllOnPage(!!val)}
                      aria-label="Select all on page"
                    />
                  </TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Outlet Name</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>City</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTableLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : displayOutlets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {viewMode === "assigned"
                        ? "No outlets currently assigned."
                        : "No outlets found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayOutlets.map((outlet) => (
                    <TableRow
                      key={outlet.id}
                      data-state={
                        selectedOutlets[outlet.id as string]
                          ? "selected"
                          : undefined
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={!!selectedOutlets[outlet.id as string]}
                          onCheckedChange={(val) =>
                            toggleRow(outlet.id as string, !!val)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        {outlet.outlet_code}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {outlet.distributor && (
                            <span className="mb-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                              {outlet.distributor.outlet_name}
                            </span>
                          )}
                          <span className="font-medium">
                            {outlet.outlet_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{outlet.region || "—"}</TableCell>
                      <TableCell>{outlet.province || "—"}</TableCell>
                      <TableCell>{outlet.city || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Manual Pagination Controls */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-xs text-muted-foreground">
              Showing {displayOutlets.length} items (Total in{" "}
              {viewMode === "assigned" ? "Assigned" : "DB"}: {currentTotalCount}
              )
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0 || isTableLoading}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <span className="px-2 text-xs text-muted-foreground">
                Page {pageIndex + 1} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => p + 1)}
                disabled={
                  pageIndex >= totalPages - 1 ||
                  isTableLoading ||
                  totalPages === 0
                }
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
