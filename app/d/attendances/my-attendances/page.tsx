"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  LogIn,
  LogOut,
  MapPin,
  Activity,
  Image as ImageIcon,
} from "lucide-react"
import dynamic from "next/dynamic"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
import { ScrollArea } from "@/components/ui/scroll-area"

// Your custom calendar & dynamic filter components
import { EventCalendar } from "@/components/event-calendar"
import {
  DynamicFilter,
  FilterField,
} from "@/components/custom/filter/dynamic-filter"

import {
  fetchAttendanceLogs,
  AttendanceLogType,
} from "@/forms/queries/attendance.query"
import { getCurrentEmployeeId } from "@/forms/queries/employee.query"
import { CoordinateHoverMap } from "@/components/custom/maps/coordinates-hover-map"

// Dynamically import MapViewer to prevent SSR issues
const MapViewer = dynamic(() => import("@/components/custom/maps/map-viewer"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-md" />,
})

const DEFAULT_FILTERS = {
  status: "all",
  dateFrom: "",
  dateTo: "",
}

export default function MyAttendancePage() {
  const [selectedLog, setSelectedLog] =
    React.useState<AttendanceLogType | null>(null)

  // --- Filter State ---
  const [filterValues, setFilterValues] =
    React.useState<Record<string, string>>(DEFAULT_FILTERS)

  const handleApplyFilters = (newValues: Record<string, string>) => {
    setFilterValues(newValues)
  }

  const handleClearFilters = () => {
    setFilterValues({})
  }

  const filterFields: FilterField[] = React.useMemo(
    () => [
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
    []
  )

  // --- Fetch Logic ---

  const { data: employeeId, isLoading: isLoadingId } = useQuery({
    queryKey: ["current_employee_id"],
    queryFn: getCurrentEmployeeId,
  })

  const statusFilter = filterValues.status?.trim() ? filterValues.status : "all"
  const dateFrom = filterValues.dateFrom || undefined
  const dateTo = filterValues.dateTo || undefined

  const { data: attendanceData, isLoading: isLoadingLogs } = useQuery({
    queryKey: [
      "my_attendance_logs",
      employeeId,
      statusFilter,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      fetchAttendanceLogs({
        pageIndex: 0,
        pageSize: 500,
        employeeId: employeeId,
        statusFilter: statusFilter !== "all" ? statusFilter : undefined,
        dateRange:
          dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined,
      }),
    enabled: !!employeeId,
  })

  const logs = attendanceData?.data

  // --- Virtualizer Setup ---
  // We use a ref for the scrollable container and initialize the virtualizer
  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: logs?.length || 0,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48, // Estimated height of a row in pixels
    overscan: 10, // Render a few extra rows above/below for smooth scrolling
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  // Calculate paddings to maintain standard HTML table dimensions
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() -
        (virtualItems[virtualItems.length - 1]?.end || 0)
      : 0

  // 3. Map the raw logs into FullCalendar Event objects
  const calendarEvents = React.useMemo(() => {
    if (!logs) return []

    return logs.map((log) => {
      const isCompleted = !!log.time_out
      return {
        id: log.id.toString(),
        title: isCompleted ? "Completed Shift" : "Active Shift",
        start: log.time_in || undefined,
        end: log.time_out || undefined,
        allDay: false,
        backgroundColor: isCompleted
          ? "hsl(var(--muted-foreground))"
          : "hsl(var(--emerald-500))",
        borderColor: isCompleted
          ? "hsl(var(--muted-foreground))"
          : "hsl(var(--emerald-600))",
        textColor: "#ffffff",
        extendedProps: { log },
      }
    })
  }, [logs])

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return "—"
    const date = new Date(isoString)
    return (
      <span className="text-xs text-muted-foreground">
        {date.toLocaleDateString()}{" "}
        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    )
  }

  if (isLoadingId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-md font-bold tracking-tight">My Attendance</h1>
        <p className="text-sm text-muted-foreground">
          View your shift history, GPS logs, and attached photos.
        </p>
      </div>

      <div className="w-full">
        <Tabs defaultValue="list" className="w-full space-y-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <DynamicFilter
              title="Filter Attendance"
              description="Narrow down your shifts by date range or status."
              fields={filterFields}
              values={filterValues}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />

            <TabsList>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <ListIcon className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar">
            {isLoadingLogs ? (
              <Skeleton className="h-[600px] w-full" />
            ) : (
              <div className="overflow-hidden rounded-md border">
                <EventCalendar
                  height="700px"
                  events={calendarEvents}
                  eventClick={(info) => {
                    setSelectedLog(
                      info.event.extendedProps.log as AttendanceLogType
                    )
                  }}
                  availableViews={["dayGridMonth", "timeGridWeek", "listWeek"]}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="list">
            {/* 1. Changed h-[600px] to max-h-[600px] so it shrinks when empty/small */}
            <div
              ref={tableContainerRef}
              className="relative max-h-[600px] w-full overflow-auto rounded-md border bg-background"
            >
              <table className="w-full caption-bottom text-sm">
                <TableHeader className="sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    {/* 2. Reduced header height from h-12 to h-10 and tightened padding */}
                    <TableHead className="h-8 px-3 text-left align-middle text-xs font-semibold text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="h-8 px-3 text-left align-middle text-xs font-semibold text-muted-foreground">
                      Time In
                    </TableHead>
                    <TableHead className="h-8 px-3 text-left align-middle text-xs font-semibold text-muted-foreground">
                      Time In Location
                    </TableHead>
                    <TableHead className="h-8 px-3 text-left align-middle text-xs font-semibold text-muted-foreground">
                      Time Out
                    </TableHead>
                    <TableHead className="h-8 px-3 text-left align-middle text-xs font-semibold text-muted-foreground">
                      Time Out Location
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoadingLogs ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5} className="py-2">
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : logs?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No attendance records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {/* Top spacer to push visible rows down */}
                      {paddingTop > 0 && (
                        <tr>
                          <td style={{ height: `${paddingTop}px` }} />
                        </tr>
                      )}

                      {/* Only render rows currently in view */}
                      {virtualItems.map((virtualRow) => {
                        const log = logs![virtualRow.index]
                        const isCompleted = !!log.time_out
                        return (
                          <TableRow
                            key={log.id}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            className="cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => setSelectedLog(log)}
                          >
                            {/* 3. Added px-3 py-1.5 to override standard spacious shadcn padding */}
                            <TableCell className="px-3 py-1.5 text-xs">
                              {isCompleted ? "Completed" : "Active Shift"}
                            </TableCell>
                            <TableCell className="px-3 py-1.5 text-xs">
                              {formatDateTime(log.time_in)}
                            </TableCell>
                            <TableCell className="px-3 py-1.5">
                              {log.time_in_lat && log.time_in_long && (
                                <CoordinateHoverMap
                                  lat={log.time_in_lat}
                                  long={log.time_in_long}
                                />
                              )}
                            </TableCell>
                            <TableCell className="px-3 py-1.5 text-xs">
                              {formatDateTime(log.time_out)}
                            </TableCell>
                            <TableCell className="px-3 py-1.5">
                              {log.time_out_lat && log.time_out_long && (
                                <CoordinateHoverMap
                                  lat={log.time_out_lat}
                                  long={log.time_out_long}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}

                      {/* Bottom spacer to preserve standard scroll height */}
                      {paddingBottom > 0 && (
                        <tr>
                          <td style={{ height: `${paddingBottom}px` }} />
                        </tr>
                      )}
                    </>
                  )}
                </TableBody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground">
              Showing {logs?.length || 0} records
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* --- Detail Viewer Modal (Unchanged) --- */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="flex max-h-[90vh] w-full flex-col overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl">
          {selectedLog && (
            <>
              <DialogHeader className="p-4">
                <DialogTitle className="text-sm">Shift Details</DialogTitle>
              </DialogHeader>

              <ScrollArea className="flex-1 px-4">
                <div>
                  <p>
                    <span className="font-semibold">Time In: </span>
                    {formatDateTime(selectedLog.time_out)}
                  </p>

                  <p>
                    <span className="font-semibold">Time Out: </span>
                    {!selectedLog.time_out ? (
                      <div className="flex inline h-48 flex-col items-center justify-center rounded-md border border-dashed bg-muted/30 text-muted-foreground">
                        <Activity className="mb-2 h-8 w-8 animate-pulse opacity-20" />
                        <span className="text-sm font-medium">
                          Shift is still active
                        </span>
                      </div>
                    ) : (
                      <>{formatDateTime(selectedLog.time_out)}</>
                    )}
                  </p>

                  <p>
                    <span className="font-semibold">Time In Location: </span>
                    <CoordinateHoverMap
                      lat={selectedLog.time_in_lat}
                      long={selectedLog.time_in_long}
                    />
                  </p>

                  <p>
                    <span className="font-semibold">Time Out Location: </span>
                    <CoordinateHoverMap
                      lat={selectedLog.time_out_lat}
                      long={selectedLog.time_out_long}
                    />
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {/* Time In Attachment */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Time In
                      </Label>
                      {selectedLog.time_in_attachment ? (
                        <div className="overflow-hidden rounded-md border bg-muted">
                          <img
                            src={selectedLog.time_in_attachment}
                            alt="Time In Proof"
                            className="h-auto max-h-56 w-full object-contain"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        </div>
                      ) : (
                        <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-md border bg-muted/50 text-muted-foreground">
                          <ImageIcon className="h-6 w-6 opacity-20" />
                          <span className="text-sm">No photo uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Time Out Attachment */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Time Out
                      </Label>
                      {selectedLog.time_out_attachment ? (
                        <div className="overflow-hidden rounded-md border bg-muted">
                          <img
                            src={selectedLog.time_out_attachment}
                            alt="Time Out Proof"
                            className="h-auto max-h-56 w-full object-contain"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        </div>
                      ) : (
                        <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-md border bg-muted/50 text-muted-foreground">
                          <ImageIcon className="h-6 w-6 opacity-20" />
                          <span className="text-sm">No photo uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex justify-end border-t bg-muted/30 px-6 py-3">
                <Button variant="default" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
