"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  LogIn,
  LogOut,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  TrendingUp,
} from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  DynamicFilter,
  FilterField,
} from "@/components/custom/filter/dynamic-filter"

import {
  fetchAttendanceLogs,
  fetchAttendanceStats,
  AttendanceLogType,
} from "@/forms/queries/attendance.query"

// IMPORT YOUR REUSABLE EMPLOYEE QUERY HERE
import { searchEmployeeOptions } from "@/forms/queries/employee.query"
import { Label } from "@/components/ui/label"

// Dynamically import the fixed MapViewer so it only loads on the client side
const MapViewer = dynamic(() => import("@/components/custom/maps/map-viewer"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-md" />,
})

export default function AttendanceLogsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // --- Pagination State ---
  const pageIndex = Number(searchParams.get("page") ?? "0")
  const pageSize = Number(searchParams.get("size") ?? "10")

  const setPagination = (newPageIndex: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPageIndex.toString())
    params.set("size", pageSize.toString())
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const [sorting, setSorting] = React.useState([{ id: "time_in", desc: true }])

  // --- Dynamic Filter State ---
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >({})
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Debounce the combobox search input
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleApplyFilters = (newValues: Record<string, string>) => {
    setFilterValues(newValues)
    setPagination(0)
  }

  const handleClearFilters = () => {
    setFilterValues({})
    setSearchQuery("")
    setPagination(0)
  }

  // --- Details Sheet State ---
  const [selectedLog, setSelectedLog] =
    React.useState<AttendanceLogType | null>(null)

  // --- Fetch Employees using your existing searchEmployeeOptions ---
  const { data: employeeOptions = [], isLoading: isLoadingEmployees } =
    useQuery({
      queryKey: ["employees_filter_list", debouncedSearch],
      queryFn: () => searchEmployeeOptions(debouncedSearch),
    })

  // --- Define Filter Fields for DynamicFilter ---
  const filterFields: FilterField[] = React.useMemo(
    () => [
      {
        id: "employee_id",
        label: "Employee",
        type: "combobox",
        options: employeeOptions, // Directly plugging in your formatted { value, label } array
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

  // Extract variables for the query payload
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
    queryKey: ["attendances_stats", dateFrom, dateTo],
    queryFn: () =>
      fetchAttendanceStats({
        dateRange:
          dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined,
      }),
  })

  // --- Format Helper ---
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

  const totalPages = Math.ceil((data?.rowCount ?? 0) / pageSize)

  return (
    <div className="flex flex-col space-y-6">
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
            <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
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

      {/* 2. Dynamic Filters Toolbar Container */}
      <DynamicFilter
        title="Filter Attendance"
        description="Narrow down attendance records by employee, date range, or shift status."
        fields={filterFields}
        values={filterValues}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* 3. Custom Data Table Block */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Click on a row to view GPS locations and shift proofs.
          </CardDescription>
        </CardHeader>

        <div className="rounded-md border-y">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No attendance records found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((log) => {
                  const first = log.employee?.first_name || ""
                  const last = log.employee?.last_name || ""
                  const empNo = log.employee?.employee_no || "No ID"
                  const isCompleted = !!log.time_out

                  return (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {`${first} ${last}`.trim() || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {empNo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isCompleted ? "secondary" : "default"}
                          className={
                            !isCompleted
                              ? "border-emerald-200 bg-emerald-500/10 text-emerald-600"
                              : ""
                          }
                        >
                          {isCompleted ? "Completed" : "Active Shift"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {formatDateTime(log.time_in)}
                          {log.time_in_lat && log.time_in_long && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />{" "}
                              {log.time_in_lat.toFixed(4)},{" "}
                              {log.time_in_long.toFixed(4)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {formatDateTime(log.time_out)}
                          {log.time_out_lat && log.time_out_long && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />{" "}
                              {log.time_out_lat.toFixed(4)},{" "}
                              {log.time_out_long.toFixed(4)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {data?.data.length ? pageIndex * pageSize + 1 : 0} to{" "}
            {Math.min((pageIndex + 1) * pageSize, data?.rowCount ?? 0)} of{" "}
            {data?.rowCount ?? 0} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(pageIndex - 1)}
              disabled={pageIndex === 0 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(pageIndex + 1)}
              disabled={pageIndex >= totalPages - 1 || isLoading}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* 4. Detail Viewer Sheet (Slide-out Panel) */}
      <Sheet
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-2xl">
          {selectedLog && (
            <div className="flex h-full flex-col">
              <div className="border-b bg-muted/30 p-6">
                <SheetHeader>
                  <SheetTitle className="text-xl">Shift Details</SheetTitle>
                  <SheetDescription>
                    {selectedLog.employee?.first_name}{" "}
                    {selectedLog.employee?.last_name} •{" "}
                    {selectedLog.employee?.employee_no}
                  </SheetDescription>
                </SheetHeader>
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {/* Time In Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <LogIn className="h-5 w-5 text-emerald-500" />
                      <h3 className="text-lg font-semibold">Time In</h3>
                    </div>
                    <div>{formatDateTime(selectedLog.time_in)}</div>

                    {/* Time In Map */}
                    {selectedLog.time_in_lat && selectedLog.time_in_long ? (
                      <MapViewer
                        lat={selectedLog.time_in_lat}
                        long={selectedLog.time_in_long}
                      />
                    ) : (
                      <div className="flex h-24 items-center justify-center rounded-md border bg-muted/50 text-sm text-muted-foreground">
                        No Location Data
                      </div>
                    )}

                    {/* Time In Attachment */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Attachment
                      </Label>
                      {selectedLog.time_in_attachment ? (
                        <div className="overflow-hidden rounded-md border bg-muted">
                          <img
                            src={selectedLog.time_in_attachment}
                            alt="Time In Proof"
                            className="h-auto max-h-64 w-full object-contain"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        </div>
                      ) : (
                        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-md border bg-muted/50 text-muted-foreground">
                          <ImageIcon className="h-8 w-8 opacity-20" />
                          <span className="text-sm">No photo uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time Out Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <LogOut className="h-5 w-5 text-orange-500" />
                      <h3 className="text-lg font-semibold">Time Out</h3>
                    </div>

                    {!selectedLog.time_out ? (
                      <div className="flex h-48 flex-col items-center justify-center rounded-md border border-dashed bg-muted/30 text-muted-foreground">
                        <Activity className="mb-2 h-8 w-8 animate-pulse opacity-20" />
                        <span className="text-sm font-medium">
                          Shift is still active
                        </span>
                      </div>
                    ) : (
                      <>
                        <div>{formatDateTime(selectedLog.time_out)}</div>

                        {/* Time Out Map */}
                        {selectedLog.time_out_lat &&
                        selectedLog.time_out_long ? (
                          <MapViewer
                            lat={selectedLog.time_out_lat}
                            long={selectedLog.time_out_long}
                          />
                        ) : (
                          <div className="flex h-24 items-center justify-center rounded-md border bg-muted/50 text-sm text-muted-foreground">
                            No Location Data
                          </div>
                        )}

                        {/* Time Out Attachment */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Attachment
                          </Label>
                          {selectedLog.time_out_attachment ? (
                            <div className="overflow-hidden rounded-md border bg-muted">
                              <img
                                src={selectedLog.time_out_attachment}
                                alt="Time Out Proof"
                                className="h-auto max-h-64 w-full object-contain"
                                onError={(e) =>
                                  (e.currentTarget.style.display = "none")
                                }
                              />
                            </div>
                          ) : (
                            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-md border bg-muted/50 text-muted-foreground">
                              <ImageIcon className="h-8 w-8 opacity-20" />
                              <span className="text-sm">No photo uploaded</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <div className="flex justify-end border-t bg-muted/30 p-4">
                <Button variant="outline" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
