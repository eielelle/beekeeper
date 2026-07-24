"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef, PaginationState } from "@tanstack/react-table"
import { Receipt, BadgeDollarSign } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/custom/data-table/table"
import { ExpenseReportForm } from "@/forms/expense_report.form"
import { supabase } from "@/lib/supabase"

export default function MyExpensesPage() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [globalFilter, setGlobalFilter] = React.useState("")

  // Fetch Reports
  const { data, isLoading } = useQuery({
    queryKey: ["my-expenses", pagination, globalFilter],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      let query = supabase
        .from("expense_reports")
        .select("*", { count: "exact" })
        .eq("employee_id", emp?.id)

      if (globalFilter) query = query.ilike("report_title", `%${globalFilter}%`)

      const from = pagination.pageIndex * pagination.pageSize
      const { data, count } = await query
        .range(from, from + pagination.pageSize - 1)
        .order("created_at", { ascending: false })
      return { data: data || [], rowCount: count || 0 }
    },
  })

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "report_title",
        header: "Report Title",
        cell: ({ row }) => (
          <span className="font-semibold">{row.getValue("report_title")}</span>
        ),
      },
      {
        accessorKey: "date_from",
        header: "Period",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
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
    []
  )

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.rowCount ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="My Expense Reports"
        description="File and track your business expenses."
        entityName="Expense Report"
        columns={columns}
        data={data?.data ?? []}
        rowCount={data?.rowCount ?? 0}
        isLoading={isLoading}
        searchPlaceholder="Search reports..."
        globalFilter={globalFilter}
        onSearchChange={setGlobalFilter}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={[]}
        onSortingChange={() => {}}
        renderForm={({ id, onClose }) => (
          <ExpenseReportForm editId={id?.toString()} onClose={onClose} />
        )}
      />
    </div>
  )
}
