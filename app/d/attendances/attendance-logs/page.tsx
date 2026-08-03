"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  Activity,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  TrendingUp,
  ArrowUpDown,
} from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"

import {
  DynamicFilter,
  FilterField,
} from "@/components/custom/filter/dynamic-filter"

import {
  fetchAttendanceLogs,
  fetchAttendanceStats,
  AttendanceLogType,
} from "@/forms/queries/attendance.query"
import { searchEmployeeOptions } from "@/forms/queries/employee.query"
import { CoordinateHoverMap } from "@/components/custom/maps/coordinates-hover-map"

export default function AttendanceLogsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // --- URL-based Pagination State ---
  const pageIndex = Number(searchParams.get("page") ?? "0")
  const pageSize = Number(searchParams.get("limit") ?? "100") // Default to 100 since we have virtualized tables

  const updateParams = React.useCallback(
    (newPage: number, newLimit: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", newPage.toString())
      params.set("limit", newLimit.toString())
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, router]
  )

  // --- Custom Limit State (React 19 Safe Sync) ---
  const [isCustomLimit, setIsCustomLimit] = React.useState(
    ![10, 100, 1000].includes(pageSize)
  )
  const [customLimitValue, setCustomLimitValue] = React.useState(
    pageSize.toString()
  )
  const [prevPageSize, setPrevPageSize] = React.useState(pageSize)

  if (pageSize !== prevPageSize) {
    setPrevPageSize(pageSize)
    setCustomLimitValue(pageSize.toString())
    setIsCustomLimit(![10, 100, 1000].includes(pageSize))
  }

  const handleCustomLimitSubmit = (e: React.FormEvent | React.FocusEvent) => {
    e.preventDefault()
    const val = parseInt(customLimitValue, 10)
    if (!isNaN(val) && val > 0) {
      updateParams(0, val)
    } else {
      setCustomLimitValue(pageSize.toString())
    }
  }

  // --- Sort & Filter State ---
  const [sorting, setSorting] = React.useState<{ id: string; desc: boolean }[]>(
    [{ id: "time_in", desc: true }]
  )
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >({})
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleApplyFilters = (newValues: Record<string, string>) => {
    setFilterValues(newValues)
    updateParams(0, pageSize)
  }

  const handleClearFilters = () => {
    setFilterValues({})
    setSearchQuery("")
    updateParams(0, pageSize)
  }

  // --- Details Dialog State ---
  const [selectedLog, setSelectedLog] =
    React.useState<AttendanceLogType | null>(null)

  // --- Fetch Employees using searchEmployeeOptions ---
  const { data: employeeOptions = [], isLoading: isLoadingEmployees } =
    useQuery({
      queryKey: ["employees_filter_list", debouncedSearch],
      queryFn: () => searchEmployeeOptions(debouncedSearch),
    })

  // --- Filter Configuration ---
  const filterFields: FilterField[] = React.useMemo(
    () => [
      {
        id: "employee_id",
        label: "Employee",
        type: "combobox",
        options: employeeOptions,
        placeholder: "Filter by employee",
        onSearchChange: setSearchQuery,
        isLoading: isLoadingEmployees,
      },
      {
        id: "status",
        label: "Shift Status",
        type: "select",
        options: [
          { label: "Active Shifts (Time In Only)", value: "active" },
          { label: "Completed Shifts", value: "completed" },
        ],
        placeholder: "Filter by status",
      },
      {
        id: "dateFrom",
        label: "Date From",
        type: "date",
      },
      {
        id: "dateTo",
        label: "Date To",
        type: "date",
      },
    ],
    [employeeOptions, isLoadingEmployees]
  )

  const statusFilter = filterValues.status?.trim() ? filterValues.status : "all"
  const employeeId = filterValues.employee_id?.trim()
    ? filterValues.employee_id
    : "all"
  const dateFrom = filterValues.dateFrom || undefined
  const dateTo = filterValues.dateTo || undefined

  // --- Supabase Query: Table Data ---
  const { data, isLoading } = useQuery({
    queryKey: [
      "attendances_table",
      pageIndex,
      pageSize,
      sorting,
      statusFilter,
      employeeId,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      fetchAttendanceLogs({
        pageIndex,
        pageSize,
        sorting,
        statusFilter,
        employeeId,
        dateRange:
          dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined,
      }),
  })

  // --- Supabase Query: Stats ---
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["attendances_stats", dateFrom, dateTo, employeeId],
    queryFn: () =>
      fetchAttendanceStats({
        dateRange:
          dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined,
      }),
  })

  // --- Virtualizer Setup ---
  const tableContainerRef = React.useRef<HTMLDivElement>(null)
  const logs = data?.data || []

  const rowVirtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 52, // Slightly taller row height estimate
    overscan: 10,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() -
        (virtualItems[virtualItems.length - 1]?.end || 0)
      : 0

  // --- Format Helpers ---
  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return "—"
    const date = new Date(isoString)
    return (
      <span className="text-xs whitespace-nowrap text-muted-foreground">
        {date.toLocaleDateString()}{" "}
        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    )
  }

  const totalCount = data?.rowCount ?? 0
  const totalPages = Math.ceil(totalCount / pageSize)
  const currentSortValue = `${sorting[0]?.id}-${sorting[0]?.desc}`

  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] flex-col pb-6">
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-md font-bold tracking-tight">Attendance Logs</h2>
          <p className="text-sm text-muted-foreground">
            Monitor company-wide employee shift histories and GPS locations.
          </p>
        </div>

        {/* 1. Stats Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground">
                Total Shifts
              </CardTitle>
              <Activity className="h-4 w-4 text-primary-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-[60px] bg-primary-foreground/20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {statsData?.total_logs ?? 0}
                  </div>
                  <p className="mt-1 flex items-center text-xs text-primary-foreground/80">
                    Total records found
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Shifts
              </CardTitle>
              <LogIn className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-[60px]" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {statsData?.active ?? 0}
                  </div>
                  <p className="mt-1 flex items-center text-xs font-medium text-emerald-500">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Currently operational
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

        {/* 2. Toolbar (Sort + Dynamic Filters) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row">
            {/* Sorting Dropdown */}
            <Select
              value={currentSortValue}
              onValueChange={(val) => {
                const [id, descStr] = val.split("-")
                setSorting([{ id, desc: descStr === "true" }])
                updateParams(0, pageSize)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time_in-true">Time In (Newest)</SelectItem>
                <SelectItem value="time_in-false">Time In (Oldest)</SelectItem>
                <SelectItem value="time_out-true">Time Out (Newest)</SelectItem>
                <SelectItem value="time_out-false">
                  Time Out (Oldest)
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Dynamic Filter */}
            <div className="w-full sm:w-auto">
              <DynamicFilter
                title="Filter Attendance"
                description="Narrow down attendance records by employee, date range, or shift status."
                fields={filterFields}
                values={filterValues}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
              />
            </div>
          </div>
        </div>

        {/* 3. Virtualized Data Table Block */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              Click on a row to view full map GPS locations and shift proofs.
            </CardDescription>
          </CardHeader>

          <div
            ref={tableContainerRef}
            className="relative max-h-[600px] w-full overflow-auto rounded-b-md border-t bg-background"
          >
            <table className="w-full caption-bottom text-sm">
              <TableHeader className="sticky top-0 z-10 bg-muted/90 shadow-sm backdrop-blur">
                <TableRow>
                  <TableHead className="h-10 px-3 text-left align-middle text-xs font-semibold text-muted-foreground">
                    Employee
                  </TableHead>
                  <TableHead className="h-10 px-3 text-left align-middle text-xs font-semibold text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-10 px-3 text-left align-middle text-xs font-semibold text-muted-foreground">
                    Time In
                  </TableHead>
                  <TableHead className="h-10 px-3 text-left align-middle text-xs font-semibold text-muted-foreground">
                    Time In Loc.
                  </TableHead>
                  <TableHead className="h-10 px-3 text-left align-middle text-xs font-semibold text-muted-foreground">
                    Time Out
                  </TableHead>
                  <TableHead className="h-10 px-3 text-left align-middle text-xs font-semibold text-muted-foreground">
                    Time Out Loc.
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="px-3 py-2">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No attendance records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* Top spacer */}
                    {paddingTop > 0 && (
                      <tr>
                        <td colSpan={6} style={{ height: `${paddingTop}px` }} />
                      </tr>
                    )}

                    {/* Virtual Rows */}
                    {virtualItems.map((virtualRow) => {
                      const log = logs[virtualRow.index]
                      const first = log.employee?.first_name || ""
                      const last = log.employee?.last_name || ""
                      const empNo = log.employee?.employee_no || "No ID"
                      const isCompleted = !!log.time_out

                      return (
                        <TableRow
                          key={log.id}
                          data-index={virtualRow.index}
                          ref={rowVirtualizer.measureElement}
                          className="cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => setSelectedLog(log)}
                        >
                          <TableCell className="px-3 py-2">
                            <div className="flex flex-col">
                              <span className="font-medium whitespace-nowrap">
                                {`${first} ${last}`.trim() || "Unknown"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {empNo}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-xs">
                            <Badge
                              variant={isCompleted ? "secondary" : "default"}
                              className={`whitespace-nowrap ${
                                !isCompleted
                                  ? "border-emerald-200 bg-emerald-500/10 text-emerald-600 shadow-none"
                                  : ""
                              }`}
                            >
                              {isCompleted ? "Completed" : "Active Shift"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-xs">
                            {formatDateTime(log.time_in)}
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            {log.time_in_lat && log.time_in_long ? (
                              <CoordinateHoverMap
                                lat={log.time_in_lat}
                                long={log.time_in_long}
                              />
                            ) : (
                              <span className="text-[10px] text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-xs">
                            {formatDateTime(log.time_out)}
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            {log.time_out_lat && log.time_out_long ? (
                              <CoordinateHoverMap
                                lat={log.time_out_lat}
                                long={log.time_out_long}
                              />
                            ) : (
                              <span className="text-[10px] text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {/* Bottom spacer */}
                    {paddingBottom > 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ height: `${paddingBottom}px` }}
                        />
                      </tr>
                    )}
                  </>
                )}
              </TableBody>
            </table>
          </div>
        </Card>
      </div>

      {/* --- Bottom Pagination Controls --- */}
      <div className="mt-auto flex flex-col gap-4 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="shrink-0 font-medium text-muted-foreground">
            Rows per page:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[10, 100, 1000].map((preset) => (
              <Button
                key={preset}
                variant={
                  pageSize === preset && !isCustomLimit ? "secondary" : "ghost"
                }
                size="sm"
                className="h-8 px-3"
                onClick={() => updateParams(0, preset)}
              >
                {preset}
              </Button>
            ))}

            {isCustomLimit ? (
              <form
                onSubmit={handleCustomLimitSubmit}
                className="flex items-center"
              >
                <Input
                  type="number"
                  min={1}
                  className="h-8 w-20 px-2 text-center text-sm"
                  value={customLimitValue}
                  onChange={(e) => setCustomLimitValue(e.target.value)}
                  onBlur={handleCustomLimitSubmit}
                  autoFocus
                />
              </form>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3"
                onClick={() => {
                  setIsCustomLimit(true)
                  setCustomLimitValue(pageSize.toString())
                }}
              >
                Custom
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <span className="shrink-0 font-medium text-muted-foreground">
            Showing {logs.length ? pageIndex * pageSize + 1 : 0} -{" "}
            {Math.min((pageIndex + 1) * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateParams(Math.max(0, pageIndex - 1), pageSize)}
              disabled={pageIndex === 0 || isLoading}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Prev
            </Button>
            <span className="px-2 font-medium text-muted-foreground">
              {pageIndex + 1} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateParams(pageIndex + 1, pageSize)}
              disabled={
                pageIndex >= totalPages - 1 || isLoading || totalPages === 0
              }
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* --- Detail Viewer Dialog Modal --- */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="flex max-h-[90vh] w-full flex-col overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl">
          {selectedLog && (
            <>
              <DialogHeader className="p-4 sm:px-6">
                <DialogTitle className="text-xl">Shift Details</DialogTitle>
                <DialogDescription>
                  {selectedLog.employee?.first_name}{" "}
                  {selectedLog.employee?.last_name} •{" "}
                  {selectedLog.employee?.employee_no}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 px-4 sm:px-6">
                <div className="mt-2 text-sm">
                  <p className="flex items-center gap-2">
                    <span className="w-36 font-semibold">Time In: </span>
                    {formatDateTime(selectedLog.time_in)}
                  </p>

                  <p className="flex items-center gap-2">
                    <span className="w-36 font-semibold">Time Out: </span>
                    {!selectedLog.time_out ? (
                      <span className="flex items-center text-xs text-muted-foreground italic">
                        <Activity className="mr-2 h-3 w-3 animate-pulse opacity-50" />
                        Shift is still active
                      </span>
                    ) : (
                      formatDateTime(selectedLog.time_out)
                    )}
                  </p>

                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Time In Location: </span>
                    {selectedLog.time_in_lat && selectedLog.time_in_long ? (
                      <CoordinateHoverMap
                        lat={selectedLog.time_in_lat}
                        long={selectedLog.time_in_long}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </p>

                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Time Out Location: </span>
                    {selectedLog.time_out_lat && selectedLog.time_out_long ? (
                      <CoordinateHoverMap
                        lat={selectedLog.time_out_lat}
                        long={selectedLog.time_out_long}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </p>

                  <div className="mt-8 grid grid-cols-1 gap-6 pb-6 sm:grid-cols-2">
                    {/* Time In Attachment */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Time In Attachment
                      </Label>
                      {selectedLog.time_in_attachment ? (
                        <div className="overflow-hidden rounded-md border bg-muted">
                          <img
                            src={selectedLog.time_in_attachment}
                            alt="Time In Proof"
                            className="h-auto max-h-[350px] w-full object-contain"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        </div>
                      ) : (
                        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-md border bg-muted/50 text-muted-foreground">
                          <ImageIcon className="h-6 w-6 opacity-20" />
                          <span className="text-sm">No photo uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Time Out Attachment */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Time Out Attachment
                      </Label>
                      {selectedLog.time_out_attachment ? (
                        <div className="overflow-hidden rounded-md border bg-muted">
                          <img
                            src={selectedLog.time_out_attachment}
                            alt="Time Out Proof"
                            className="h-auto max-h-[350px] w-full object-contain"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        </div>
                      ) : (
                        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-md border bg-muted/50 text-muted-foreground">
                          <ImageIcon className="h-6 w-6 opacity-20" />
                          <span className="text-sm">No photo uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex justify-end border-t bg-muted/30 px-6 py-4">
                <Button variant="default" onClick={() => setSelectedLog(null)}>
                  Close Details
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
