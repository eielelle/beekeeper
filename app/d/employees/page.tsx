"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
  ShieldAlert,
  User,
  ArrowUpDown,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

import {
  fetchEmployees,
  deleteEmployee,
  EmployeeStoreType,
} from "@/forms/queries/employee.query"

import { EmployeeAvatar } from "@/components/custom/avatars/default-avatar"
import {
  DynamicFilter,
  FilterField,
} from "@/components/custom/filter/dynamic-filter"

export default function EmployeesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // --- URL-based Pagination State ---
  const pageIndex = Number(searchParams.get("page") ?? "0")
  const pageSize = Number(searchParams.get("limit") ?? "10")

  const updateParams = React.useCallback(
    (newPage: number, newLimit: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", newPage.toString())
      params.set("limit", newLimit.toString())
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, router]
  )

  // --- Search, Filter & Sort State ---
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >({})
  const [sorting, setSorting] = React.useState<{ id: string; desc: boolean }[]>(
    [{ id: "created_at", desc: true }]
  )

  // --- Custom Limit State ---
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

  // --- Deletion State ---
  const [employeeToDelete, setEmployeeToDelete] =
    React.useState<EmployeeStoreType | null>(null)

  // --- Filter Configuration ---
  const filterFields: FilterField[] = React.useMemo(
    () => [
      {
        id: "role",
        label: "System Role",
        type: "select",
        options: [
          { label: "Superuser", value: "superuser" },
          { label: "Employee", value: "employee" },
        ],
        placeholder: "Filter by role",
      },
      {
        id: "gender",
        label: "Gender",
        type: "select",
        options: [
          { label: "Male", value: "Male" },
          { label: "Female", value: "Female" },
        ],
        placeholder: "Filter by gender",
      },
    ],
    []
  )

  const handleApplyFilters = (newValues: Record<string, string>) => {
    setFilterValues(newValues)
    updateParams(0, pageSize)
  }

  const handleClearFilters = () => {
    setFilterValues({})
    updateParams(0, pageSize)
  }

  // --- Supabase Queries & Mutations ---
  const { data, isLoading } = useQuery({
    queryKey: [
      "employees",
      pageIndex,
      pageSize,
      globalFilter,
      filterValues,
      sorting,
    ],
    queryFn: () =>
      fetchEmployees({
        pageIndex,
        pageSize,
        globalFilter,
        role: filterValues.role,
        gender: filterValues.gender,
        sorting,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteEmployee(id),
    onSuccess: () => {
      toast.success("Employee deleted successfully.")
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      setEmployeeToDelete(null)
    },
    onError: (error: Error) => {
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

  const currentSortValue = `${sorting[0]?.id}-${sorting[0]?.desc}`

  return (
    // ADDED: min-h-[calc(100vh-100px)] and h-full to force the container to take up screen height
    <div className="flex h-full min-h-[calc(100vh-6rem)] flex-col pb-6">
      {/* ADDED: flex-1 to allow the top section to grow and push the footer down */}
      <div className="flex-1 space-y-6">
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

        {/* Toolbar (Search + Sort + Dynamic Filters) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Bar */}
          <div className="relative w-full shrink-0 sm:w-80">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, name, or email..."
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value)
                updateParams(0, pageSize)
              }}
              className="bg-background pl-9"
            />
          </div>

          {/* Actions Container */}
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
                <SelectItem value="created_at-true">Newest First</SelectItem>
                <SelectItem value="created_at-false">Oldest First</SelectItem>
                <SelectItem value="first_name-false">Name (A-Z)</SelectItem>
                <SelectItem value="first_name-true">Name (Z-A)</SelectItem>
                <SelectItem value="employee_no-false">
                  Employee ID (Asc)
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Dynamic Filter Component */}
            <div className="w-full sm:w-auto">
              <DynamicFilter
                title="Filter Employees"
                description="Narrow down the directory by role or gender."
                fields={filterFields}
                values={filterValues}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
              />
            </div>
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
                  {/* Left Side: Avatar + Name & Subtitle */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <EmployeeAvatar employee={employee} />

                    <div className="flex flex-col overflow-hidden">
                      <CardTitle
                        className="truncate text-sm font-semibold"
                        title={getFullName(employee)}
                      >
                        {getFullName(employee)}
                      </CardTitle>

                      {/* Subtitle: System Role + ID Badge */}
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                          {employee.is_superuser ? (
                            <>
                              <ShieldAlert className="mr-1 h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-500">
                                Superuser
                              </span>
                            </>
                          ) : (
                            <>
                              <User className="mr-1 h-3 w-3 opacity-70" />
                              <span>Employee</span>
                            </>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="px-1.5 py-0 font-mono text-[9px]"
                        >
                          {employee.employee_no}
                        </Badge>
                      </div>
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
      </div>

      {/* Bottom Pagination Controls */}
      {/* ADDED: mt-auto pushes this element to the very bottom of the flex container */}
      <div className="mt-auto flex flex-col gap-4 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Left Side: Rows per page limits */}
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

        {/* Right Side: Page navigation */}
        <div className="flex items-center gap-6">
          <span className="shrink-0 font-medium text-muted-foreground">
            Showing {employees.length ? pageIndex * pageSize + 1 : 0} -{" "}
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
