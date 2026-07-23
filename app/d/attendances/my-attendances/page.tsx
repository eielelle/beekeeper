"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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

  // 1. Get the securely logged-in Employee ID
  const { data: employeeId, isLoading: isLoadingId } = useQuery({
    queryKey: ["current_employee_id"],
    queryFn: getCurrentEmployeeId,
  })

  // Prepare filter variables for the query
  const statusFilter = filterValues.status?.trim() ? filterValues.status : "all"
  const dateFrom = filterValues.dateFrom || undefined
  const dateTo = filterValues.dateTo || undefined

  // 2. Fetch only THIS employee's attendance records
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
        pageSize: 500, // Fetch up to 500 to comfortably populate the month view calendar
        employeeId: employeeId,
        statusFilter: statusFilter !== "all" ? statusFilter : undefined,
        dateRange:
          dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined,
      }),
    enabled: !!employeeId,
  })

  // 3. Map the raw logs into FullCalendar Event objects
  const calendarEvents = React.useMemo(() => {
    if (!attendanceData?.data) return []

    return attendanceData.data.map((log) => {
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
  }, [attendanceData?.data])

  // Helper to format date strings cleanly
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

  if (isLoadingId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Skeleton className="mx-auto h-full w-full max-w-7xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your shift history, GPS logs, and attached photos.
        </p>
      </div>

      {/* Dynamic Filter Toolbar */}
      <DynamicFilter
        title="Filter Attendance"
        description="Narrow down your shifts by date range or status."
        fields={filterFields}
        values={filterValues}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <ListIcon className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        {/* --- CALENDAR VIEW --- */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Calendar</CardTitle>
              <CardDescription>
                Click on any shift block to view the full details and map
                locations.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    availableViews={[
                      "dayGridMonth",
                      "timeGridWeek",
                      "listWeek",
                    ]}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- LIST VIEW --- */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Recent Shifts</CardTitle>
              <CardDescription>
                A chronological list of your filtered time logs.
              </CardDescription>
            </CardHeader>
            <div className="rounded-md border-y">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Time In</TableHead>
                    <TableHead>Time Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLogs ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={3}>
                          <Skeleton className="h-12 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : attendanceData?.data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No attendance records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceData?.data.map((log) => {
                      const isCompleted = !!log.time_out
                      return (
                        <TableRow
                          key={log.id}
                          className="cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => setSelectedLog(log)}
                        >
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
            {/* Show a helpful message since we are fetching up to 500 flat items for the calendar */}
            <div className="flex items-center justify-center border-t p-4 text-sm text-muted-foreground">
              Showing the most recent filtered records (up to 500).
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- Detail Viewer Sheet (Slide-out Panel) --- */}
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
                    Review your time-in and time-out data for this shift.
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
