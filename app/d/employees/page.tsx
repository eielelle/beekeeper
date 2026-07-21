"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  fetchEmployees,
  deleteEmployee,
  EmployeeStoreType,
} from "@/forms/queries/employee.query"
import Link from "next/link"

export default function EmployeesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // --- Search & Pagination State ---
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pageIndex, setPageIndex] = React.useState(0)
  const pageSize = 12

  // --- Deletion State ---
  const [employeeToDelete, setEmployeeToDelete] =
    React.useState<EmployeeStoreType | null>(null)

  // --- Supabase Queries & Mutations ---
  const { data, isLoading } = useQuery({
    queryKey: ["employees", pageIndex, pageSize, globalFilter],
    queryFn: () =>
      fetchEmployees({
        pageIndex,
        pageSize,
        globalFilter,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteEmployee(id),
    onSuccess: () => {
      toast.success("Employee deleted successfully.")
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      setEmployeeToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete employee.")
    },
  })

  const employees = (data?.data as EmployeeStoreType[]) || []
  const totalCount = data?.rowCount ?? 0
  const totalPages = Math.ceil(totalCount / pageSize)

  // --- Helpers ---
  const getFullName = (emp: EmployeeStoreType) => {
    const first = emp.first_name || ""
    const middle = emp.middle_name ? ` ${emp.middle_name.charAt(0)}.` : ""
    const last = emp.last_name || ""
    return `${first}${middle} ${last}`.trim()
  }

  // Generates initials just in case the API is blocked/down
  const getInitials = (first?: string, last?: string) => {
    if (!first && !last) return null
    return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase()
  }

  // Generates the Dicebear Lorelei avatar based on name & gender
  const getAvatarUrl = (emp: EmployeeStoreType) => {
    if (emp.avatar_url) return emp.avatar_url

    const seedName = encodeURIComponent(
      `${emp.first_name} ${emp.last_name} ${emp.gender || ""}`
    )

    // Assign distinct pastel background colors based on gender
    let bgColors = "backgroundColor=b6e3f4,c0aede,d1d4f9" // Default (Neutral/Cool)

    if (emp.gender === "Female") {
      bgColors = "backgroundColor=ffdfbf,ffd5dc,f4dce8" // Warm pinks/peaches
    } else if (emp.gender === "Male") {
      bgColors = "backgroundColor=b6e3f4,c0aede,d1d4f9" // Cool blues/purples
    }

    return `https://api.dicebear.com/9.x/lorelei/svg?seed=${seedName}&${bgColors}`
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
              setPageIndex(0)
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
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                {/* Left Side: Avatar + Name/Badge */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <Avatar className="h-10 w-10 border bg-muted">
                    <AvatarImage
                      src={getAvatarUrl(employee)}
                      alt={employee.first_name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-xs font-medium text-muted-foreground">
                      {getInitials(employee.first_name, employee.last_name) || (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col space-y-1 overflow-hidden">
                    <Badge
                      variant="default"
                      className="w-fit px-1.5 py-0 font-mono text-[10px]"
                    >
                      {employee.employee_no}
                    </Badge>
                    <CardTitle
                      className="truncate text-sm font-semibold"
                      title={getFullName(employee)}
                    >
                      {getFullName(employee)}
                    </CardTitle>
                  </div>
                </div>

                {/* 3-Dots Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="-mt-1 -mr-2 h-8 w-8 shrink-0 p-0"
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(
                          `/d/employees/edit/${employee.id}/basic-information`
                        )
                      }
                      className="cursor-pointer"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Employee
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Delete Option */}
                    <DropdownMenuItem
                      onClick={() => setEmployeeToDelete(employee)}
                      className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
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

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!employeeToDelete}
        onOpenChange={(open) => {
          if (!open) setEmployeeToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {employeeToDelete ? getFullName(employeeToDelete) : ""}
              </strong>
              ? This action cannot be undone and will permanently remove their
              data and access from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (employeeToDelete) {
                  deleteMutation.mutate(employeeToDelete.id!)
                }
              }}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
