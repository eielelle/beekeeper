"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

// Queries
import { OutletStoreType } from "@/forms/queries/outlet.query"
import { fetchMyAssignedOutlets } from "@/forms/queries/employee-outlet.query"

export default function MyOutletsPage() {
  // TODO: Replace this with your actual logged-in user's employee ID
  const MOCK_CURRENT_EMPLOYEE_ID = "1"

  // --- Pagination & Search State ---
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pageIndex, setPageIndex] = React.useState(0)
  const pageSize = 10

  // --- Data Fetching ---
  const { data: outletsData, isLoading } = useQuery({
    queryKey: [
      "my-outlets",
      MOCK_CURRENT_EMPLOYEE_ID,
      pageIndex,
      pageSize,
      globalFilter,
    ],
    queryFn: () =>
      fetchMyAssignedOutlets({
        employeeId: MOCK_CURRENT_EMPLOYEE_ID,
        pageIndex,
        pageSize,
        globalFilter,
      }),
    enabled: !!MOCK_CURRENT_EMPLOYEE_ID, // Only run if we have an employee ID
  })

  const displayOutlets = (outletsData?.data as OutletStoreType[]) || []
  const totalCount = outletsData?.rowCount ?? 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-tight">My Outlets</h2>
          <p className="text-xs text-muted-foreground">
            View the geographic territories and locations assigned to you.
          </p>
        </div>
        <Badge variant="default" className="h-8 px-4 text-xs font-medium">
          <MapPin className="mr-2 h-3.5 w-3.5" />
          {totalCount} Total Assignments
        </Badge>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code or name..."
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value)
              setPageIndex(0) // Reset to page 1 on search
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Outlet Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Province</TableHead>
              <TableHead>City</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="mb-2 h-6 w-6 animate-spin" />
                    <span>Loading your assignments...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayOutlets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  {globalFilter
                    ? "No assigned outlets match your search."
                    : "You currently have no outlets assigned to you."}
                </TableCell>
              </TableRow>
            ) : (
              displayOutlets.map((outlet) => (
                <TableRow key={outlet.id} className="hover:bg-muted/50">
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
                      <span className="font-medium text-foreground">
                        {outlet.outlet_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] truncate text-muted-foreground"
                    title={outlet.address}
                  >
                    {outlet.address || "—"}
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

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-xs text-muted-foreground">
          Showing {displayOutlets.length} items (Total: {totalCount})
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
          <span className="px-2 text-xs font-medium text-muted-foreground">
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
    </div>
  )
}
