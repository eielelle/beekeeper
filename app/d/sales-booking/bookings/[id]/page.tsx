"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Store,
  MapPin,
  Building,
  User,
  CalendarDays,
  Loader2,
  Package,
  FileText,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { fetchSalesBookingById } from "@/forms/queries/sales_booking.query"

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const {
    data: booking,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["sales_booking", bookingId],
    queryFn: () => fetchSalesBookingById(bookingId),
    enabled: !!bookingId,
  })

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !booking) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">
          Booking not found or an error occurred.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/d/sales-bookings")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    )
  }

  // --- HELPERS ---
  const formatFullName = (emp: any) => {
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

  // --- CALCULATIONS ---
  const standardQty = booking.items
    .filter((i: any) => !i.is_sample)
    .reduce((sum: number, i: any) => sum + i.qty, 0)
  const sampleQty = booking.items
    .filter((i: any) => i.is_sample)
    .reduce((sum: number, i: any) => sum + i.qty, 0)
  const totalQty = standardQty + sampleQty

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Page Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/d/sales-bookings")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Booking Details
            </h1>
            {getStatusBadge(booking.status)}
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            ID: {booking.id}
          </p>
        </div>
      </div>

      {/* Snapshot Information Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Outlet Snapshot */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <Store className="mr-2 h-4 w-4" />
              Outlet Information (Snapshot)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold">{booking.outlet_name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                Code: {booking.outlet_code}
              </p>
            </div>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{booking.outlet_address || "No address provided"}</span>
              </div>
              <div className="flex items-start gap-2">
                <Building className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {[
                    booking.outlet_barangay,
                    booking.outlet_city,
                    booking.outlet_province,
                    booking.outlet_region,
                  ]
                    .filter(Boolean)
                    .join(", ") || "No regional data"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rep & Date Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <User className="mr-2 h-4 w-4" />
              Booking Representative
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold">
                {formatFullName(booking.employee)}
              </p>
              {booking.employee?.employee_no && (
                <p className="font-mono text-xs text-muted-foreground">
                  ID: {booking.employee.employee_no}
                </p>
              )}
            </div>
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex items-center text-muted-foreground">
                <CalendarDays className="mr-2 h-3.5 w-3.5" />
                Booked On:
              </div>
              <p className="pl-5 font-medium">
                {new Date(booking.booking_date).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Summary & Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <FileText className="mr-2 h-4 w-4" />
              Order Summary & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Standard Items:</span>
                <span className="font-medium">{standardQty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sample Items:</span>
                <span className="font-medium text-emerald-600">
                  {sampleQty}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total Quantity:</span>
                <span>{totalQty}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Notes / Instructions
              </p>
              <p className="text-sm">
                {booking.notes ? (
                  booking.notes
                ) : (
                  <span className="text-muted-foreground italic">
                    No notes provided.
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Requested Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px]">SKU Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category & Brand</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="w-[100px] text-right">UOM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {booking.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No items found in this booking.
                  </TableCell>
                </TableRow>
              ) : (
                booking.items.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">
                      {item.sku_code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.item_name}</span>
                        {item.is_sample && (
                          <Badge
                            variant="outline"
                            className="h-5 border-emerald-200 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-600"
                          >
                            Sample
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span>{item.category_name || "No Category"}</span>
                        <span className="text-muted-foreground">
                          {item.brand_name || "No Brand"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {item.qty}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {item.uom_name || "pcs"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
