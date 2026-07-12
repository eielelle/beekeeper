"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/table"
import {
  deleteExpenseType,
  fetchExpenseTypes,
  ExpenseTypeStoreType,
} from "@/forms/queries/expense_type.query"
import { ExpenseTypeForm } from "@/forms/expense_type.form"

export default function Page() {
  const queryClient = useQueryClient()

  // --- Table Control States ---
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])

  // --- Supabase Query ---
  const { data, isLoading } = useQuery({
    queryKey: [
      "expense_types",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
    ],
    queryFn: () =>
      fetchExpenseTypes({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
      }),
  })

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteExpenseType(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense_types"] })
    },
  })

  // --- Table Columns ---
  const columns = React.useMemo<ColumnDef<ExpenseTypeStoreType>[]>(
    () => [
      {
        accessorKey: "type_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "type_name",
                  desc:
                    sorting[0]?.id === "type_name" ? !sorting[0].desc : false,
                },
              ])
            }
          >
            Type Name
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("type_name")}</span>
        ),
      },
      {
        accessorKey: "type_description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.getValue("type_description") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => {
          const raw = row.getValue("created_at") as string
          return raw ? new Date(raw).toLocaleDateString() : "—"
        },
      },
    ],
    [sorting]
  )

  return (
    <DataTable
      title="Expense Types"
      description="All your expense types"
      entityName="Expense Type"
      columns={columns}
      data={data?.data ?? []}
      rowCount={data?.rowCount ?? 0}
      isLoading={isLoading}
      searchPlaceholder="Search types..."
      globalFilter={globalFilter}
      onSearchChange={setGlobalFilter}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      renderForm={({ id, onClose }) => (
        <ExpenseTypeForm editId={id?.toString()} onClose={onClose} />
      )}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id)
      }}
      isDeleting={deleteMutation.isPending}
      getItemDisplayName={(item) => item.type_name}
    />
  )
}
