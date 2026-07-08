"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, MoreHorizontal, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/custom/data-table/app-table"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// 👥 Teams Query & Types
import {
  fetchTeams,
  deleteTeam,
  TeamStoreType,
} from "@/forms/queries/team.query"

// Dropdown UI components from shadcn
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Page() {
  const queryClient = useQueryClient()

  // --- 👥 Teams Table State ---
  const [teamSorting, setTeamSorting] = React.useState<SortingState>([])
  const [teamGlobalFilter, setTeamGlobalFilter] = React.useState("")
  const teamDeferredFilter = React.useDeferredValue(teamGlobalFilter)
  const [teamPagination, setTeamPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })

  // --- React Query Server-Side Fetcher ---
  const { data: teamData } = useQuery({
    queryKey: [
      "teams",
      teamPagination.pageIndex,
      teamPagination.pageSize,
      teamSorting,
      teamDeferredFilter,
    ],
    queryFn: () =>
      fetchTeams({
        pageIndex: teamPagination.pageIndex,
        pageSize: teamPagination.pageSize,
        globalFilter: teamDeferredFilter,
        sorting: teamSorting,
      }),
  })

  // --- React Query Mutation ---
  const deleteTeamMutation = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] })
    },
  })

  // --- Columns Configuration ---
  const teamColumns: ColumnDef<TeamStoreType>[] = [
    { accessorKey: "id", header: "ID", enableSorting: false },
    { accessorKey: "team_name", header: "Team Name" },
    { accessorKey: "team_description", header: "Description" },
    { accessorKey: "approver_user_id", header: "Approver ID" },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) =>
        new Date(row.original.created_at || "").toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(item.id || "")}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/d/administration/teams/edit/${item.id}`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Team
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="focus:text-destructive-foreground text-destructive focus:bg-destructive"
                onClick={() => {
                  if (confirm(`Delete team: ${item.team_name}?`)) {
                    deleteTeamMutation.mutate(item.id || "")
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

  return (
    <div className="space-y-6">
      {/* 👥 Teams Section */}
      <section className="grid grid-cols-1 gap-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xs font-semibold">Teams</h1>
            <p className="font-mono text-xs text-muted-foreground">
              Manage internal departments and designated approval hierarchies
            </p>
          </div>
          <Link href="/d/administration/organizations/teams/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add Team
            </Button>
          </Link>
        </header>

        <DataTable
          columns={teamColumns}
          data={teamData?.data ?? []}
          rowCount={teamData?.rowCount ?? 0}
          pageIndex={teamPagination.pageIndex}
          pageSize={teamPagination.pageSize}
          sorting={teamSorting}
          globalFilter={teamGlobalFilter}
          onPaginationChange={setTeamPagination}
          onSortingChange={setTeamSorting}
          onGlobalFilterChange={setTeamGlobalFilter}
        />
      </section>
    </div>
  )
}
