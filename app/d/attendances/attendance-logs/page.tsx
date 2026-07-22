"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ColumnDef,
  SortingState,
  PaginationState,
  Updater,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  Activity,
  LogIn,
  LogOut,
  MapPin,
  Check,
  ChevronsUpDown,
  Loader2,
  Filter,
} from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { DataTable } from "@/components/custom/data-table/table"
import { supabase } from "@/lib/supabase"
import {
  fetchAttendanceLogs,
  fetchAttendanceStats,
  AttendanceLogType,
} from "@/forms/queries/attendance.query"

const DEFAULT_FILTERS = {
  employee_id: "all",
  employee_name: "All Employees",
  status: "all",
  dateFrom: "",
  dateTo: "",
}

export default function AttendanceLogsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pageIndex = Number(searchParams.get("page") ?? "0")
  const pageSize = Number(searchParams.get("size") ?? "10")

  const pagination = React.useMemo<PaginationState>(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize]
  )

  const setPagination = React.useCallback(
    (updater: Updater<PaginationState>) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", newPagination.pageIndex.toString())
      params.set("size", newPagination.pageSize.toString())
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pagination, searchParams, pathname, router]
  )

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "time_in", desc: true },
  ])

  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false)
  const [filterValues, setFilterValues] = React.useState(DEFAULT_FILTERS)
  const [tempFilters, setTempFilters] = React.useState(DEFAULT_FILTERS)

  React.useEffect(() => {
    if (isFilterSheetOpen) setTempFilters(filterValues)
  }, [isFilterSheetOpen, filterValues])

  const handleApplyFilters = () => {
    setFilterValues(tempFilters)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    setIsFilterSheetOpen(false)
  }

  const handleClearFilters = () => {
    setTempFilters(DEFAULT_FILTERS)
    setFilterValues(DEFAULT_FILTERS)
    setSearchQuery("")
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    setIsFilterSheetOpen(false)
  }

  const [openCombobox, setOpenCombobox] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees_filter_list", debouncedSearch],
    queryFn: async () => {
      let q = supabase
        .from("employees")
        .select("id, first_name, last_name, employee_no")
        .order("first_name")
        .limit(50)

      if (debouncedSearch) {
        q = q.or(
          `first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%,employee_no.ilike.%${debouncedSearch}%`
        )
      }
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })

  const statusFilter =
    filterValues.status !== "all" ? filterValues.status : undefined
  const employeeId =
    filterValues.employee_id !== "all" ? filterValues.employee_id : undefined
  const dateFrom = filterValues.dateFrom || undefined
  const dateTo = filterValues.dateTo || undefined

  const { data, isLoading } = useQuery({
    queryKey: [
      "attendances_table",
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      statusFilter,
      employeeId,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      fetchAttendanceLogs({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting: sorting as { id: string; desc: boolean }[],
        statusFilter,
        employeeId,
        dateRange:
          dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined,
      }),
  })

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["attendances_stats", dateFrom, dateTo],
    queryFn: () =>
      fetchAttendanceStats({
        dateRange:
          dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined,
      }),
  })

  // Format Helper
  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return "—"
    const date = new Date(isoString)
    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{date.toLocaleDateString()}</span>
        <span className="text-xs text-muted-foreground">
          {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    )
  }

  const columns = React.useMemo<ColumnDef<AttendanceLogType>[]>(
    () => [
      {
        accessorKey: "employee.employee_no",
        id: "employee_no",
        header: "Employee ID",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">
            {row.original.employee?.employee_no || "—"}
          </span>
        ),
      },
      {
        accessorKey: "employee.first_name",
        id: "employee_name",
        header: "Employee Name",
        cell: ({ row }) => {
          const first = row.original.employee?.first_name || ""
          const last = row.original.employee?.last_name || ""
          return (
            <span className="font-medium">
              {`${first} ${last}`.trim() || "Unknown"}
            </span>
          )
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const isCompleted = !!row.original.time_out
          return (
            <Badge
              variant={isCompleted ? "secondary" : "default"}
              className={
                !isCompleted
                  ? "border-emerald-200 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                  : ""
              }
            >
              {isCompleted ? "Completed" : "Active Shift"}
            </Badge>
          )
        },
      },
      {
        accessorKey: "time_in",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "time_in",
                  desc: sorting[0]?.id === "time_in" ? !sorting[0].desc : true,
                },
              ])
            }
          >
            Time In
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {formatDateTime(row.original.time_in)}
            {row.original.time_in_lat && row.original.time_in_long && (
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {row.original.time_in_lat.toFixed(4)},{" "}
                {row.original.time_in_long.toFixed(4)}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "time_out",
        header: "Time Out",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {formatDateTime(row.original.time_out)}
            {row.original.time_out_lat && row.original.time_out_long && (
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {row.original.time_out_lat.toFixed(4)},{" "}
                {row.original.time_out_long.toFixed(4)}
              </div>
            )}
          </div>
        ),
      },
    ],
    [sorting]
  )

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-6 px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Attendance Records
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor daily shifts and GPS locations.
          </p>
        </div>

        {/* Filter Sheet */}
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter Records
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Filter Attendance</SheetTitle>
              <SheetDescription>
                Narrow down shifts by employee, date range, or status.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 py-6">
              {/* Employee Combobox */}
              <div className="flex flex-col gap-2">
                <Label>Employee</Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {tempFilters.employee_name}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Type to search..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        {isLoadingEmployees ? (
                          <div className="flex h-16 items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : employees.length === 0 ? (
                          <CommandEmpty>No employee found.</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={() => {
                                setTempFilters({
                                  ...tempFilters,
                                  employee_id: "all",
                                  employee_name: "All Employees",
                                })
                                setOpenCombobox(false)
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${tempFilters.employee_id === "all" ? "opacity-100" : "opacity-0"}`}
                              />
                              All Employees
                            </CommandItem>
                            {employees.map((emp) => (
                              <CommandItem
                                key={emp.id}
                                value={emp.id.toString()}
                                onSelect={() => {
                                  setTempFilters({
                                    ...tempFilters,
                                    employee_id: emp.id.toString(),
                                    employee_name: `${emp.first_name} ${emp.last_name}`,
                                  })
                                  setOpenCombobox(false)
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${tempFilters.employee_id === emp.id.toString() ? "opacity-100" : "opacity-0"}`}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {emp.first_name} {emp.last_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {emp.employee_no || "No ID"}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status Select */}
              <div className="flex flex-col gap-2">
                <Label>Shift Status</Label>
                <Select
                  value={tempFilters.status}
                  onValueChange={(val) =>
                    setTempFilters({ ...tempFilters, status: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Shifts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shifts</SelectItem>
                    <SelectItem value="active">
                      Active Shifts (Time In Only)
                    </SelectItem>
                    <SelectItem value="completed">Completed Shifts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Ranges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Date From</Label>
                  <Input
                    type="date"
                    value={tempFilters.dateFrom}
                    onChange={(e) =>
                      setTempFilters({
                        ...tempFilters,
                        dateFrom: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Date To</Label>
                  <Input
                    type="date"
                    value={tempFilters.dateTo}
                    onChange={(e) =>
                      setTempFilters({ ...tempFilters, dateTo: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <SheetFooter className="mt-4 gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Stats Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {statsData?.total_logs ?? 0}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Total records found
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
            <LogIn className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {statsData?.active ?? 0}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Clocked in, not out
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {statsData?.completed ?? 0}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Full shifts logged
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        title="Shifts"
        description="Live view of shift logs."
        entityName="Shift"
        columns={columns}
        data={data?.data ?? []}
        rowCount={data?.rowCount ?? 0}
        isLoading={isLoading}
        searchPlaceholder="Filter logic handled in Sheet..."
        globalFilter=""
        onSearchChange={() => {}} // Disabled as we use the advanced filter
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        renderForm={() => null}
      />
    </div>
  )
}
