"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/table"

import { EmploymentTypeForm } from "@/forms/employment_type.form"
import {
  deleteEmploymentType,
  fetchEmploymentTypes,
  EmploymentTypeStoreType,
} from "@/forms/queries/employment_type.query"

export default function EmploymentTypesPage() {
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
      "employment_types",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
    ],
    queryFn: () =>
      fetchEmploymentTypes({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
      }),
  })

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteEmploymentType(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employment_types"] })
    },
  })

  // --- Table Columns ---
  const columns = React.useMemo<ColumnDef<EmploymentTypeStoreType>[]>(
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
            Type Name
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
      title="Employment Types"
      description="Manage worker classification categories (e.g., Regular, Probationary, Contractual)"
      entityName="Employment Type"
      columns={columns}
      data={data?.data ?? []}
      rowCount={data?.rowCount ?? 0}
      isLoading={isLoading}
      searchPlaceholder="Search employment types..."
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
          <EmploymentTypeForm editId={id?.toString()} onClose={onClose} />
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
