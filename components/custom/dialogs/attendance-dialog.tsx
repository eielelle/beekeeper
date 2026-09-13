import { useState } from "react"
import { Eye, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AttendanceLogType } from "@/forms/queries/attendance.query"
import { formatSupabaseDate } from "@/lib/helpers/date"
import { CoordinateHoverMap } from "../maps/coordinates-hover-map"

interface AttendanceDetailsProps {
  attendance: AttendanceLogType
}

export function AttendanceDetailsModal({ attendance }: AttendanceDetailsProps) {
  const [open, setOpen] = useState(false)

  const employeeName =
    `${attendance.employee?.first_name || ""} ${
      attendance.employee?.middle_name?.charAt(0)
        ? attendance.employee.middle_name.charAt(0) + ". "
        : ""
    }${attendance.employee?.last_name || ""}`.trim() || "N/A"

  // Calculate duration
  const getDuration = () => {
    if (!attendance.time_in || !attendance.time_out) return "-"
    const diffMs =
      new Date(attendance.time_out).getTime() -
      new Date(attendance.time_in).getTime()
    if (diffMs < 0) return "-"
    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0")
    const minutes = String(totalMinutes % 60).padStart(2, "0")
    return `${hours}h ${minutes}m`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="xs" variant="ghost">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Attendance Details</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-2 border-b pb-4 text-sm">
            <span className="font-semibold text-muted-foreground">
              Employee:
            </span>
            <span>
              {employeeName} ({attendance.employee?.employee_no || "N/A"})
            </span>

            <span className="font-semibold text-muted-foreground">
              Total Time:
            </span>
            <span>{getDuration()}</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Time In Section */}
            <div className="flex flex-col gap-3 rounded-md border p-4">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Time In</span>
                <span className="text-sm text-muted-foreground">
                  {attendance.time_in
                    ? formatSupabaseDate(attendance.time_in, {
                        preset: "short",
                        includeTime: true,
                      })
                    : "-"}
                </span>
              </div>

              {attendance.time_in_lat && attendance.time_in_long ? (
                <div className="h-[120px] overflow-hidden rounded-md border">
                  <CoordinateHoverMap
                    lat={attendance.time_in_lat}
                    long={attendance.time_in_long}
                  />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  No location data
                </span>
              )}

              {attendance.time_in_attachment && (
                <div className="mt-2">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
                    <ImageIcon className="h-3 w-3" /> Attachment
                  </span>
                  <a
                    href={attendance.time_in_attachment}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={attendance.time_in_attachment}
                      alt="Time In Attachment"
                      className="h-32 w-full rounded-md border object-cover transition-opacity hover:opacity-80"
                    />
                  </a>
                </div>
              )}
            </div>

            {/* Time Out Section */}
            <div className="flex flex-col gap-3 rounded-md border p-4">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Time Out</span>
                <span className="text-sm text-muted-foreground">
                  {attendance.time_out
                    ? formatSupabaseDate(attendance.time_out, {
                        preset: "short",
                        includeTime: true,
                      })
                    : "-"}
                </span>
              </div>

              {attendance.time_out_lat && attendance.time_out_long ? (
                <div className="h-[120px] overflow-hidden rounded-md border">
                  <CoordinateHoverMap
                    lat={attendance.time_out_lat}
                    long={attendance.time_out_long}
                  />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  No location data
                </span>
              )}

              {attendance.time_out_attachment && (
                <div className="mt-2">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
                    <ImageIcon className="h-3 w-3" /> Attachment
                  </span>
                  <a
                    href={attendance.time_out_attachment}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={attendance.time_out_attachment}
                      alt="Time Out Attachment"
                      className="h-32 w-full rounded-md border object-cover transition-opacity hover:opacity-80"
                    />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
