"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/table"
import { deleteStt, fetchStts, SttStoreType } from "@/forms/queries/stt.query"
import { SttForm } from "@/forms/stt.form"

const getFirstItem = (data: any) => (Array.isArray(data) ? data[0] : data)

export default function Page() {
  const queryClient = useQueryClient()

  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])

  const { data, isLoading } = useQuery({
    queryKey: [
      "stts",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting,
    ],
    queryFn: () =>
      fetchStts({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: sorting as { id: string; desc: boolean }[],
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteStt(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stts"] })
    },
  })

  const columns = React.useMemo<ColumnDef<SttStoreType>[]>(
    () => [
      {
        accessorKey: "outlets.outlet_name",
        id: "outlet_name",
        header: "Outlet",
        cell: ({ row }) => {
          const outlet = getFirstItem(row.original.outlets)
          return (
            <span className="font-semibold text-primary">
              {outlet?.outlet_name || "—"}
            </span>
          )
        },
      },
      {
        accessorKey: "skus.sku_code",
        id: "sku_code",
        header: "SKU Code",
        cell: ({ row }) => {
          const sku = getFirstItem(row.original.skus)
          return (
            <span className="font-mono text-sm">{sku?.sku_code || "—"}</span>
          )
        },
      },
      {
        accessorKey: "skus.item_name",
        id: "item_name",
        header: "Item Name",
        cell: ({ row }) => {
          const sku = getFirstItem(row.original.skus)
          return <span>{sku?.item_name || "—"}</span>
        },
      },
      {
        accessorKey: "qty",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              setSorting([
                {
                  id: "qty",
                  desc: sorting[0]?.id === "qty" ? !sorting[0].desc : false,
                },
              ])
            }
          >
            Quantity
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("qty")}</span>
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
      title="Sales-to-Trade Transfers"
      description="Manage STT records and cart checkouts to outlets."
      entityName="STT"
      columns={columns}
      data={data?.data ?? []}
      rowCount={data?.rowCount ?? 0}
      isLoading={isLoading}
      searchPlaceholder="Search by ID..."
      globalFilter={globalFilter}
      onSearchChange={setGlobalFilter}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      renderForm={({ id, onClose }) => (
        <div className="max-h-[80vh] overflow-y-auto pr-1">
          <SttForm editId={id?.toString()} onClose={onClose} />
        </div>
      )}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id)
      }}
      isDeleting={deleteMutation.isPending}
      getItemDisplayName={(item) => {
        const sku = getFirstItem(item.skus)
        const outlet = getFirstItem(item.outlets)
        return sku
          ? `STT of ${sku.sku_code} at ${outlet?.outlet_name}`
          : `STT Entry (Qty: ${item.qty})`
      }}
    />
  )
}
