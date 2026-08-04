"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ColumnDef,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table"
import { Receipt, ArrowUpDown } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { DataTable } from "@/components/custom/data-table/table"
import { FilterField } from "@/components/custom/filter/dynamic-filter"
import { SortOption } from "@/components/custom/sort/dynamic-sorter"

import { ExpenseReportForm } from "@/forms/expense_report.form"
import { supabase } from "@/lib/supabase"

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
  { id: "dateFrom", label: "Report Date From", type: "date" },
  { id: "dateTo", label: "Report Date To", type: "date" },
]

const sortOptions: SortOption[] = [
  { label: "Created (Newest)", value: "created_at-true" },
  { label: "Created (Oldest)", value: "created_at-false" },
  { label: "Report Name (A-Z)", value: "report_title-false" },
  { label: "Report Name (Z-A)", value: "report_title-true" },
]

export default function MyExpenseReportsPage() {
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

  const handleApplyFilters = (newValues: Record<string, string>) => {
    setFilterValues(newValues)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const handleClearFilters = () => {
    setFilterValues({})
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const { data, isLoading } = useQuery({
    queryKey: [
      "my-expense-reports",
      pagination,
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

      // Fetch the parent report AND the amounts of the child expenses to calculate the total
      let query = supabase
        .from("expense_reports")
        .select("*, expenses(amount)", { count: "exact" })
        .eq("employee_id", emp.id)

      if (globalFilter) query = query.ilike("report_title", `%${globalFilter}%`)
      if (filterValues.status && filterValues.status !== "all")
        query = query.eq("status", filterValues.status)
      if (filterValues.dateFrom)
        query = query.gte("date_from", filterValues.dateFrom)
      if (filterValues.dateTo) query = query.lte("date_to", filterValues.dateTo)

      if (sorting && sorting.length > 0) {
        query = query.order(sorting[0].id, { ascending: !sorting[0].desc })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      const from = pagination.pageIndex * pagination.pageSize
      const { data, count, error } = await query.range(
        from,
        from + pagination.pageSize - 1
      )

      if (error) throw error
      return { data: data || [], rowCount: count || 0 }
    },
  })

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "report_title",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold text-gray-700 dark:text-gray-300"
            onClick={() =>
              setSorting([
                {
                  id: "report_title",
                  desc:
                    sorting[0]?.id === "report_title"
                      ? !sorting[0].desc
                      : false,
                },
              ])
            }
          >
            Report Title <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold">{row.getValue("report_title")}</span>
        ),
      },
      {
        id: "total_amount",
        header: "Total Amount",
        cell: ({ row }) => {
          // Aggregate the child expenses to get the total report amount
          const expenses = row.original.expenses || []
          const total = expenses.reduce(
            (sum: number, exp: any) => sum + Number(exp.amount || 0),
            0
          )

          return (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
              }).format(total)}
            </span>
          )
        },
      },
      {
        accessorKey: "date_from",
        header: "Period",
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {new Date(row.original.date_from).toLocaleDateString()} -{" "}
            {new Date(row.original.date_to).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.rowCount ?? 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Total expense reports filed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 pb-6">
        <DataTable
          title="My Expense Reports"
          description="Group and file your business expenses."
          entityName="Report"
          columns={columns}
          data={data?.data ?? []}
          rowCount={data?.rowCount ?? 0}
          isLoading={isLoading}
          searchPlaceholder="Search reports..."
          globalFilter={globalFilter}
          onSearchChange={setGlobalFilter}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={(updater) => {
            setSorting(updater)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }}
          sortOptions={sortOptions}
          filterFields={filterFields}
          filterValues={filterValues}
          onFilterChange={handleApplyFilters}
          onFilterClear={handleClearFilters}
          renderForm={({ id, onClose }) => (
            <ExpenseReportForm editId={id?.toString()} onClose={onClose} />
          )}
        />
      </div>
    </div>
  )
}
