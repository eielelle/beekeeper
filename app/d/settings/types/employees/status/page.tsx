"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/table"

import { EmploymentStatusForm } from "@/forms/employment_status.form"
import {
  deleteEmploymentStatus,
  fetchEmploymentStatuses,
  EmploymentStatusType,
} from "@/forms/queries/employment_status.query"

export default function EmploymentStatusesPage() {
  const queryClient = useQueryClient()

  // --- Table Control States ---
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])

  // --- Fetch Query ---
  const { data, isLoading } = useQuery({
    queryKey: [
      "employment_statuses",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
    ],
    queryFn: () =>
      fetchEmploymentStatuses({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
      }),
  })

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteEmploymentStatus(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employment_statuses"] })
    },
  })

  // --- Table Columns ---
  const columns = React.useMemo<ColumnDef<EmploymentStatusType>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting((prev) => [
                {
                  id: "name",
                  desc: prev[0]?.id === "name" ? !prev[0].desc : false,
                },
              ])
            }
          >
            Status Name
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("name")}</span>
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
    []
  )

  return (
    <DataTable
      title="Employment Statuses"
      description="Manage active worker lifecycle states (e.g., Active, Suspended, Terminated)"
      entityName="Employment Status"
      columns={columns}
      data={data?.data ?? []}
      rowCount={data?.rowCount ?? 0}
      isLoading={isLoading}
      searchPlaceholder="Search employment statuses..."
      globalFilter={globalFilter}
      onSearchChange={(val) => {
        setGlobalFilter(val)
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
      }}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      renderForm={({ id, onClose }) => (
        <div className="max-h-[80vh] overflow-y-auto pr-1">
          <EmploymentStatusForm editId={id?.toString()} onClose={onClose} />
        </div>
      )}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id)
      }}
      isDeleting={deleteMutation.isPending}
      getItemDisplayName={(item) => item.name}
    />
  )
}
