"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ColumnDef,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table"
import { Receipt, BadgeDollarSign, ArrowUpDown } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { DataTable } from "@/components/custom/data-table/table"
import { FilterField } from "@/components/custom/filter/dynamic-filter"
import { SortOption } from "@/components/custom/sort/dynamic-sorter"

import { ExpenseForm } from "@/forms/expense.form"
import { supabase } from "@/lib/supabase"

// Define Filter Options
const filterFields: FilterField[] = [
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Pending", value: "pending" },
      { label: "Approved", value: "approved" },
      { label: "Rejected", value: "rejected" },
    ],
    placeholder: "All Statuses",
  },
  {
    id: "dateFrom",
    label: "Expense Date From",
    type: "date",
  },
  {
    id: "dateTo",
    label: "Expense Date To",
    type: "date",
  },
]

// Define Sort Options
const sortOptions: SortOption[] = [
  { label: "Created (Newest)", value: "created_at-true" },
  { label: "Created (Oldest)", value: "created_at-false" },
  { label: "Amount (High to Low)", value: "amount-true" },
  { label: "Amount (Low to High)", value: "amount-false" },
  { label: "Expense Date (Newest)", value: "date_from-true" },
  { label: "Expense Date (Oldest)", value: "date_from-false" },
]

export default function MyExpensesPage() {
  // --- Table Control States ---
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ])
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >({})

  // Handlers
  const handleApplyFilters = (newValues: Record<string, string>) => {
    setFilterValues(newValues)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const handleClearFilters = () => {
    setFilterValues({})
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const handleSortingChange = (updater: Updater<SortingState>) => {
    setSorting(updater)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  // --- Fetch Expenses ---
  const { data, isLoading } = useQuery({
    queryKey: [
      "expenses",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
      filterValues,
    ],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return { data: [], rowCount: 0 }

      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!emp) return { data: [], rowCount: 0 }

      let query = supabase
        .from("expenses")
        .select(
          "*, expense_reports!inner(employee_id, status), expense_types(type_name)",
          { count: "exact" }
        )
        .eq("expense_reports.employee_id", emp.id)

      // Apply Search
      if (globalFilter) {
        query = query.ilike("notes", `%${globalFilter}%`)
      }

      // Apply Filters
      if (filterValues.status && filterValues.status !== "all") {
        // Since status is on the hidden wrapper report, we use the !inner join syntax
        query = query.eq("expense_reports.status", filterValues.status)
      }
      if (filterValues.dateFrom) {
        query = query.gte("date_from", filterValues.dateFrom)
      }
      if (filterValues.dateTo) {
        query = query.lte("date_to", filterValues.dateTo)
      }

      // Apply Sorting
      if (sorting && sorting.length > 0) {
        const sort = sorting[0]
        query = query.order(sort.id, { ascending: !sort.desc })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      // Apply Pagination
      const from = pagination.pageIndex * pagination.pageSize
      const { data, count, error } = await query.range(
        from,
        from + pagination.pageSize - 1
      )

      if (error) {
        console.error("Error fetching expenses:", error)
        return { data: [], rowCount: 0 }
      }

      return { data: data || [], rowCount: count || 0 }
    },
  })

  // --- Columns ---
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "expense_type",
        header: "Expense Type",
        cell: ({ row }) => {
          const typeName = row.original.expense_types?.type_name || "Unknown"
          return <span className="font-semibold">{typeName}</span>
        },
      },
      {
        accessorKey: "amount",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold text-gray-700 dark:text-gray-300"
            onClick={() => {
              setSorting([
                {
                  id: "amount",
                  desc: sorting[0]?.id === "amount" ? !sorting[0].desc : true,
                },
              ])
            }}
          >
            Amount
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("amount") || "0")
          return (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
              }).format(amount)}
            </span>
          )
        },
      },
      {
        accessorKey: "date_from",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold text-gray-700 dark:text-gray-300"
            onClick={() => {
              setSorting([
                {
                  id: "date_from",
                  desc:
                    sorting[0]?.id === "date_from" ? !sorting[0].desc : true,
                },
              ])
            }}
          >
            Period
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {new Date(row.original.date_from).toLocaleDateString()} -{" "}
            {new Date(row.original.date_to).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <span
            className="block max-w-[200px] truncate text-sm text-muted-foreground"
            title={row.getValue("notes")}
          >
            {row.getValue("notes") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          // Status is retrieved from the hidden parent report
          const status = row.original.expense_reports?.status || "pending"
          return (
            <Badge
              variant={
                status === "approved"
                  ? "default"
                  : status === "rejected"
                    ? "destructive"
                    : "secondary"
              }
            >
              {status.toUpperCase()}
            </Badge>
          )
        },
      },
    ],
    [sorting]
  )

  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] flex-col space-y-6">
      {/* Stats Board */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.rowCount ?? 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Total individual expenses filed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Data Table */}
      <div className="flex-1 pb-6">
        <DataTable
          title="My Expenses"
          description="File and track your business expenses."
          entityName="Expense"
          columns={columns}
          data={data?.data ?? []}
          rowCount={data?.rowCount ?? 0}
          isLoading={isLoading}
          searchPlaceholder="Search notes..."

          // Data Table State Props
          globalFilter={globalFilter}
          onSearchChange={setGlobalFilter}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={handleSortingChange}

          // Filters & Sort Additions
          sortOptions={sortOptions}
          filterFields={filterFields}
          filterValues={filterValues}
          onFilterChange={handleApplyFilters}
          onFilterClear={handleClearFilters}

          // Form Handling
          // onAdd={route}
        />
      </div>
    </div>
  )
}
