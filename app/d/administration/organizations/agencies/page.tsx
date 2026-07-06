"use client"

import * as React from "react"
import { DataTable } from "@/components/custom/data-table/app-table"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { Plus, MoreHorizontal, Edit, Trash } from "lucide-react"
import Link from "next/link"

// Dropdown UI components from shadcn
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  AgencyStoreType,
  deleteAgency,
  fetchAgencies,
} from "@/forms/queries/agency.query"

export default function Page() {
  const queryClient = useQueryClient()

  // Table state management
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [globalFilter, setGlobalFilter] = React.useState("")
  const deferredGlobalFilter = React.useDeferredValue(globalFilter)

  // React Query: Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAgency,
    onSuccess: () => {
      // Automatically refetches table data from the Supabase server on complete
      queryClient.invalidateQueries({ queryKey: ["agencies"] })
    },
  })

  // Defining columns inline inside the component so they can read the delete mutation state
  const columns: ColumnDef<AgencyStoreType>[] = [
    {
      accessorKey: "id",
      header: "ID",
      enableSorting: false,
    },
    {
      accessorKey: "agency_name",
      header: "Agency Name",
    },
    {
      accessorKey: "agency_description",
      header: "Agency Description",
    },
    {
      accessorKey: "created_at",
      header: "Created At",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const agency = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>

              {/* Copy ID action */}
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(agency.id || "")
                  toast.info("Copied to clipboard")
                }}
              >
                Copy ID
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Edit Route Action */}
              <DropdownMenuItem asChild>
                <Link
                  href={`/d/administration/organizations/agencies/edit/${agency.id}`}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Details
                </Link>
              </DropdownMenuItem>

              {/* Delete Action */}
              <DropdownMenuItem
                className="focus:text-destructive-foreground text-destructive focus:bg-destructive"
                onClick={() => {
                  if (
                    confirm(
                      `Are you sure you want to delete ${agency.agency_name}?`
                    )
                  ) {
                    deleteMutation.mutate(agency.id || "")
                  }
                }}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // React Query server data fetcher
  const { data } = useQuery({
    queryKey: [
      "agencies",
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      deferredGlobalFilter,
    ],
    queryFn: () =>
      fetchAgencies({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter: deferredGlobalFilter,
        sorting,
      }),
  })

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your Agencies</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your company's agencies here
          </p>
        </div>

        <nav>
          <Link href={"/d/administration/organizations/agencies/new"}>
            <Button size={"sm"}>
              <Plus className="mr-2 h-4 w-4" /> Add Agency
            </Button>
          </Link>
        </nav>
      </header>

      <div>
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          rowCount={data?.rowCount ?? 0}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          sorting={sorting}
          globalFilter={globalFilter}
          onPaginationChange={setPagination}
          onSortingChange={setSorting}
          onGlobalFilterChange={setGlobalFilter}
        />
      </div>
    </section>
  )
}
