"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/table"

import { PositionForm } from "@/forms/position.form"
import {
  deletePosition,
  fetchPositions,
  PositionType,
} from "@/forms/queries/position.query"

export default function PositionsPage() {
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
      "positions",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
    ],
    queryFn: () =>
      fetchPositions({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
      }),
  })

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deletePosition(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] })
    },
  })

  // --- Table Columns ---
  const columns = React.useMemo<ColumnDef<PositionType>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting((prev) => [
                {
                  id: "code",
                  desc: prev[0]?.id === "code" ? !prev[0].desc : false,
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
            {row.getValue("code") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting((prev) => [
                {
                  id: "title",
                  desc: prev[0]?.id === "title" ? !prev[0].desc : false,
                },
              ])
            }
          >
            Position Title
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("title")}</span>
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
      title="Positions"
      description="Manage job titles, role positions, and organizational levels"
      entityName="Position"
      columns={columns}
      data={data?.data ?? []}
      rowCount={data?.rowCount ?? 0}
      isLoading={isLoading}
      searchPlaceholder="Search positions by code or title..."
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
          <PositionForm editId={id?.toString()} onClose={onClose} />
        </div>
      )}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id)
      }}
      isDeleting={deleteMutation.isPending}
      getItemDisplayName={(item) =>
        item.code ? `${item.code} (${item.title})` : item.title
      }
    />
  )
}
