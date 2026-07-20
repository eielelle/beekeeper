"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

import {
  fetchEmployees,
  EmployeeStoreType,
} from "@/forms/queries/employee.query"
import Link from "next/link"

export default function EmployeesPage() {
  const router = useRouter()

  // --- Search & Pagination State ---
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pageIndex, setPageIndex] = React.useState(0)
  const pageSize = 12 // Increased to 12 so the grid fills out nicely (e.g. 3x4 or 4x3)

  // --- Supabase Query ---
  const { data, isLoading } = useQuery({
    queryKey: ["employees", pageIndex, pageSize, globalFilter],
    queryFn: () =>
      fetchEmployees({
        pageIndex,
        pageSize,
        globalFilter,
      }),
  })

  const employees = (data?.data as EmployeeStoreType[]) || []
  const totalCount = data?.rowCount ?? 0
  const totalPages = Math.ceil(totalCount / pageSize)

  // --- Helper for displaying full name ---
  const getFullName = (emp: EmployeeStoreType) => {
    const first = emp.first_name || ""
    const middle = emp.middle_name ? ` ${emp.middle_name.charAt(0)}.` : ""
    const last = emp.last_name || ""
    return `${first}${middle} ${last}`.trim()
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-md font-bold tracking-tight">Employees</h2>
          <p className="text-sm text-muted-foreground">
            Manage your employee directory and contact details.
          </p>
        </div>
        <Link href={"/d/employees/new"}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, name, or email..."
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value)
              setPageIndex(0) // Reset to first page on search
            }}
            className="bg-background pl-9"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : employees.length === 0 ? (
        <Card className="flex h-40 items-center justify-center border-dashed">
          <p className="text-muted-foreground">No employees found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {employees.map((employee) => (
            <Card
              key={employee.id}
              className="flex flex-col transition-shadow hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex flex-col space-y-1.5 overflow-hidden">
                  <Badge variant="default" className="w-fit font-mono text-xs">
                    {employee.employee_no}
                  </Badge>
                  <CardTitle
                    className="truncate text-sm"
                    title={getFullName(employee)}
                  >
                    {getFullName(employee)}
                  </CardTitle>
                </div>

                {/* 3-Dots Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="-mt-2 -mr-2 h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/employees/${employee.id}/edit`)
                      }
                      className="cursor-pointer"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Employee
                    </DropdownMenuItem>
                    {/* Add other actions like Delete here if needed later */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="flex flex-col space-y-2 text-sm text-muted-foreground">
                <div
                  className="flex items-center truncate"
                  title={employee.email}
                >
                  <Mail className="mr-2 h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-xs">
                    {employee.email || "No email"}
                  </span>
                </div>
                <div className="flex items-center truncate">
                  <Phone className="mr-2 h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-xs">
                    {employee.phone || "No phone"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-xs text-muted-foreground">
          Showing {employees.length} of {totalCount} employees
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
