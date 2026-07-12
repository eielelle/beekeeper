"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/table"
import {
  deleteOrganization,
  fetchOrganizations,
  OrganizationStoreType,
} from "@/forms/queries/organization.query"
import { OrganizationForm } from "@/forms/organization.form"

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
      "organizations",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
    ],
    queryFn: () =>
      fetchOrganizations({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
      }),
  })

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteOrganization(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
    },
  })

  // --- Table Columns ---
  const columns = React.useMemo<ColumnDef<OrganizationStoreType>[]>(
    () => [
      {
        accessorKey: "organization_code",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "organization_code",
                  desc:
                    sorting[0]?.id === "organization_code"
                      ? !sorting[0].desc
                      : false,
                },
              ])
            }
          >
            Code
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono font-semibold">
            {row.getValue("organization_code")}
          </span>
        ),
      },
      {
        accessorKey: "organization_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "organization_name",
                  desc:
                    sorting[0]?.id === "organization_name"
                      ? !sorting[0].desc
                      : false,
                },
              ])
            }
          >
            Organization Name
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.getValue("organization_name")}
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
      title="Organizations"
      description="All registered system organizations"
      entityName="Organization"
      columns={columns}
      data={data?.data ?? []}
      rowCount={data?.rowCount ?? 0}
      isLoading={isLoading}
      searchPlaceholder="Search by code or name..."
      globalFilter={globalFilter}
      onSearchChange={setGlobalFilter}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      renderForm={({ id, onClose }) => (
        <OrganizationForm editId={id?.toString()} onClose={onClose} />
      )}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id)
      }}
      isDeleting={deleteMutation.isPending}
      getItemDisplayName={(item) =>
        `${item.organization_code} (${item.organization_name})`
      }
    />
  )
}
