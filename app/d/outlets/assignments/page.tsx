"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Save,
  ListChecks,
  Globe,
  ArrowUpDown,
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
import { cn } from "@/lib/utils"

import {
  regions,
  provinces,
  cities,
  Region,
  Province,
  City,
} from "select-philippines-address"

import { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table"
import { DataTable } from "@/components/custom/data-table/table"
import { FilterField } from "@/components/custom/filter/dynamic-filter"
import { SortOption } from "@/components/custom/sort/dynamic-sorter"

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

  React.useEffect(() => {
    ;(async () => {
      const data = await regions()
      setRegionsData(data)
    })()
  }, [])

  // --- View Mode & Table Control State ---
  const [viewMode, setViewMode] = React.useState<"all" | "assigned">("all")
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "outlet_name", desc: false },
  ])
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  })

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
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >({})

  // FIX 1: Safely load Provinces without infinite loops
  React.useEffect(() => {
    const loadProvinces = async () => {
      if (filterValues.region && regionsData.length > 0) {
        const r = regionsData.find((x) => x.region_name === filterValues.region)
        if (r) {
          const data = await provinces(r.region_code)
          setProvincesData(data)
        }
      } else {
        setProvincesData([])
      }
    }
    loadProvinces()
  }, [filterValues.region, regionsData])

  // FIX 2: Safely load Cities without infinite loops
  React.useEffect(() => {
    const loadCities = async () => {
      if (filterValues.province && provincesData.length > 0) {
        const p = provincesData.find(
          (x) => x.province_name === filterValues.province
        )
        if (p) {
          const data = await cities(p.province_code)
          setCitiesData(data)
        }
      } else {
        setCitiesData([])
      }
    }
    loadCities()
  }, [filterValues.province, provincesData])

  const handleApplyFilters = React.useCallback(
    (newValues: Record<string, string>) => {
      const updatedValues = { ...newValues }
      if (newValues.region !== filterValues.region) {
        delete updatedValues.province
        delete updatedValues.city
      } else if (newValues.province !== filterValues.province) {
        delete updatedValues.city
      }

      setFilterValues(updatedValues)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
      setViewMode("all")
    },
    [filterValues.region, filterValues.province]
  )

  const handleClearFilters = React.useCallback(() => {
    setFilterValues({})
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  // --- Data Fetching: ALL Mode ---
  const { data: allOutletsData, isLoading: isLoadingAll } = useQuery({
    queryKey: [
      "outlets-assignment-all",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      filterValues,
      sorting,
    ],
    queryFn: () =>
      fetchOutlets({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
        distributorFilter: filterValues.type || undefined,
        region: filterValues.region || undefined,
        province: filterValues.province || undefined,
        city: filterValues.city || undefined,
      }),
    enabled: viewMode === "all" && !!selectedEmployeeId,
  })

  // --- Data Fetching: ASSIGNED Mode (Local Chunking) ---
  const { data: assignedChunkData, isLoading: isLoadingAssignedChunk } =
    useQuery({
      queryKey: [
        "outlets-assignment-chunk",
        selectedIdsArray,
        pagination.pageIndex,
        pagination.pageSize,
      ],
      queryFn: async () => {
        const chunkIds = selectedIdsArray.slice(
          pagination.pageIndex * pagination.pageSize,
          (pagination.pageIndex + 1) * pagination.pageSize
        )
        if (chunkIds.length === 0) return []
        return getOutletsByIds(chunkIds)
      },
      enabled: viewMode === "assigned" && !!selectedEmployeeId,
    })

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

  const isTableLoading =
    viewMode === "assigned" ? isLoadingAssignedChunk : isLoadingAll

  // FIX 3: Stabilize checkbox toggles with useCallback
  const toggleRow = React.useCallback((id: string, checked: boolean) => {
    setSelectedOutlets((prev) => {
      const next = { ...prev }
      if (checked) next[id] = true
      else delete next[id]
      return next
    })
  }, [])

  const toggleAllOnPage = React.useCallback(
    (checked: boolean) => {
      setSelectedOutlets((prev) => {
        const next = { ...prev }
        displayOutlets.forEach((outlet) => {
          if (!outlet.id) return
          if (checked) next[outlet.id] = true
          else delete next[outlet.id]
        })
        return next
      })
    },
    [displayOutlets]
  )

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

  // --- DataTable Config ---
  const sortOptions: SortOption[] = [
    { label: "Outlet Name (A-Z)", value: "outlet_name-false" },
    { label: "Outlet Name (Z-A)", value: "outlet_name-true" },
    { label: "Outlet Code (A-Z)", value: "outlet_code-false" },
    { label: "Outlet Code (Z-A)", value: "outlet_code-true" },
  ]

  const filterFields: FilterField[] = [
    {
      id: "type",
      label: "Outlet Type",
      type: "select",
      options: [
        { label: "Distributors", value: "distributors" },
        { label: "Outlets with no Distributor", value: "no_distributor" },
        { label: "Outlets with Distributor", value: "has_distributor" },
      ],
      placeholder: "All Types",
    },
    {
      id: "region",
      label: "Region",
      type: "select",
      options: regionsData.map((r) => ({
        label: r.region_name,
        value: r.region_name,
      })),
      placeholder: "All Regions",
    },
    {
      id: "province",
      label: "Province",
      type: "select",
      options: provincesData.map((p) => ({
        label: p.province_name,
        value: p.province_name,
      })),
      placeholder: "All Provinces",
    },
    {
      id: "city",
      label: "City",
      type: "select",
      options: citiesData.map((c) => ({
        label: c.city_name,
        value: c.city_name,
      })),
      placeholder: "All Cities",
    },
  ]

  const columns = React.useMemo<ColumnDef<OutletStoreType>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={
              isAllPageSelected ||
              (isSomePageSelected ? "indeterminate" : false)
            }
            onCheckedChange={(val) => toggleAllOnPage(!!val)}
            aria-label="Select all on page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={!!selectedOutlets[row.original.id as string]}
            onCheckedChange={(val) =>
              toggleRow(row.original.id as string, !!val)
            }
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "outlet_code",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold text-gray-700 dark:text-gray-300"
            onClick={() => {
              setSorting([
                {
                  id: "outlet_code",
                  desc:
                    sorting[0]?.id === "outlet_code" ? !sorting[0].desc : false,
                },
              ])
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
          >
            Code
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold whitespace-nowrap text-muted-foreground">
            {row.getValue("outlet_code")}
          </span>
        ),
      },
      {
        accessorKey: "outlet_name",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold text-gray-700 dark:text-gray-300"
            onClick={() => {
              setSorting([
                {
                  id: "outlet_name",
                  desc:
                    sorting[0]?.id === "outlet_name" ? !sorting[0].desc : false,
                },
              ])
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
          >
            Outlet Name
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const distributor = row.original.distributor
          return (
            <div className="flex max-w-[200px] flex-col truncate sm:max-w-[300px]">
              {distributor && (
                <span className="mb-0.5 truncate text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
                  {distributor.outlet_name}
                </span>
              )}
              <span className="truncate text-sm font-medium text-foreground">
                {row.getValue("outlet_name")}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "region",
        header: () => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Region
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("region") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "province",
        header: () => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Province
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("province") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "city",
        header: () => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            City
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("city") || "—"}
          </span>
        ),
      },
    ],
    [
      sorting,
      setPagination,
      selectedOutlets,
      isAllPageSelected,
      isSomePageSelected,
      toggleAllOnPage,
      toggleRow,
    ]
  )

  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] flex-col space-y-6">
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
      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="pb-4">
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
                className="w-full justify-between"
              >
                {selectedEmployeeName || "Search employee..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] p-0"
              align="start"
            >
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

      {/* 2. OUTLET TABLE */}
      <div
        className={cn(
          "flex-1 pb-6 transition-opacity",
          !selectedEmployeeId && "pointer-events-none opacity-50"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">2. Manage Assignments</h3>
            <p className="text-sm text-muted-foreground">
              {selectedEmployeeId
                ? `Currently managing territory for ${selectedEmployeeName}.`
                : "Select an employee above to manage their outlets."}
            </p>
          </div>

          {/* VIEW MODE TOGGLE */}
          <div className="flex rounded-lg border bg-muted/50 p-1">
            <Button
              variant={viewMode === "all" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-8 text-xs",
                viewMode === "all" && "bg-white shadow-sm dark:bg-zinc-800"
              )}
              onClick={() => {
                setViewMode("all")
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
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
                viewMode === "assigned" && "bg-white shadow-sm dark:bg-zinc-800"
              )}
              onClick={() => {
                setViewMode("assigned")
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            >
              <ListChecks className="mr-2 h-3.5 w-3.5" />
              Assigned ({selectedIdsArray.length})
            </Button>
          </div>
        </div>

        {/* REUSABLE DATATABLE */}
        <DataTable
          columns={columns}
          data={displayOutlets}
          rowCount={currentTotalCount}
          isLoading={isTableLoading}
          searchPlaceholder="Search by code or name..."

          // Data Table State Props
          globalFilter={globalFilter}
          onSearchChange={(val) => {
            setGlobalFilter(val)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={(updater) => {
            setSorting(updater)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }}

          // Show filters only in "All" view mode
          sortOptions={viewMode === "all" ? sortOptions : undefined}
          filterFields={viewMode === "all" ? filterFields : undefined}
          filterValues={filterValues}
          onFilterChange={handleApplyFilters}
          onFilterClear={handleClearFilters}
        />
      </div>
    </div>
  )
}
