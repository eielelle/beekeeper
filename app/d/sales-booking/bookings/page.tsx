"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  User,
  Store,
  Package,
  Eye,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  fetchSalesBookings,
  SalesBookingRecord,
} from "@/forms/queries/sales_booking.query"

export default function SalesBookingsListPage() {
  const router = useRouter()

  // --- STATE ---
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pageIndex, setPageIndex] = React.useState(0)
  const pageSize = 10

  // --- FETCH DATA ---
  const { data, isLoading } = useQuery({
    queryKey: ["sales_bookings", pageIndex, pageSize, globalFilter],
    queryFn: () => fetchSalesBookings({ pageIndex, pageSize, globalFilter }),
  })

  const bookings = data?.data || []
  const totalCount = data?.rowCount ?? 0
  const totalPages = Math.ceil(totalCount / pageSize)

  // --- HELPERS ---
  const formatFullName = (emp: SalesBookingRecord["employee"]) => {
    if (!emp) return "Unknown Employee"
    const first = emp.first_name || ""
    const last = emp.last_name || ""
    return `${first} ${last}`.trim() || "Unknown Employee"
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
          >
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge
            variant="default"
            className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
          >
            Approved
          </Badge>
        )
      case "cancelled":
        return (
          <Badge
            variant="destructive"
            className="bg-red-500/10 text-red-600 hover:bg-red-500/20"
          >
            Cancelled
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {status}
          </Badge>
        )
    }
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Sales Bookings</h2>
          <p className="text-sm text-muted-foreground">
            View and manage all sales bookings and their assigned
            representatives.
          </p>
        </div>
        <Button onClick={() => router.push("/d/sales-booking")}>
          <Plus className="mr-2 h-4 w-4" />{" "}
          {/* Assuming you import Plus from lucide-react */}
          New Booking
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Order History</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search outlet name or code..."
                className="bg-muted/50 pl-9"
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value)
                  setPageIndex(0) // Reset to page 1 on search
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Outlet</TableHead>
                <TableHead>Booked By</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-48 text-center text-muted-foreground"
                  >
                    No bookings found.
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => {
                  // Calculate totals from nested items
                  const standardQty = booking.items
                    .filter((i) => !i.is_sample)
                    .reduce((sum, i) => sum + i.qty, 0)
                  const sampleQty = booking.items
                    .filter((i) => i.is_sample)
                    .reduce((sum, i) => sum + i.qty, 0)

                  return (
                    <TableRow key={booking.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(booking.booking_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5 text-sm font-semibold">
                            <Store className="h-3.5 w-3.5 text-muted-foreground" />
                            {booking.outlet_name}
                          </span>
                          <span className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {booking.outlet_code}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5 text-sm font-medium">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatFullName(booking.employee)}
                          </span>
                          {booking.employee?.employee_no && (
                            <span className="mt-0.5 ml-5 font-mono text-[10px] text-muted-foreground">
                              ID: {booking.employee.employee_no}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            {standardQty}
                          </div>
                          {sampleQty > 0 && (
                            <span className="rounded-sm bg-emerald-500/10 px-1.5 text-[10px] font-medium text-emerald-600">
                              + {sampleQty} samples
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>{getStatusBadge(booking.status)}</TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
            <span>
              Showing {bookings.length} of {totalCount} bookings
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0 || isLoading}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <span className="px-2 font-medium">
                Page {pageIndex + 1} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => p + 1)}
                disabled={
                  pageIndex >= totalPages - 1 || isLoading || totalPages === 0
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
