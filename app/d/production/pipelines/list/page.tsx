"use client"

import { columns } from "@/components/custom/data-table/columns/production-pipelines"
import { DataTable } from "@/components/custom/data-table/core/data-table"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useUrlTableState } from "@/hooks/use-url-table-state"
import { FilterPayload } from "@/types/filter-payloads"
import { fetchProductionPipelines } from "@/forms/queries/production-pipeline.query"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ProductionPipelinesPage() {
  const router = useRouter()
  const { page, size, sorting, globalFilter, columnFilters } =
    useUrlTableState()

  const pipelines = useQuery({
    queryKey: [
      "production-pipelines",
      page,
      size,
      sorting,
      globalFilter,
      columnFilters,
    ],
    queryFn: () =>
      fetchProductionPipelines({
        pageIndex: page - 1,
        pageSize: size,
        sorting,
        globalFilter: globalFilter,
        columnFilters: columnFilters as { id: string; value: FilterPayload }[],
      }),
    placeholderData: keepPreviousData,
  })

  const data = pipelines?.data
  const pipelinesData = data?.data ?? []
  const rowCount = data?.rowCount ?? 0
  const pageCount = Math.ceil(rowCount / size)

  return (
    <div className="space-y-4">
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Production Pipelines</CardTitle>
          <CardDescription>
            Review and manage your manufacturing workflows and step sequences.
          </CardDescription>

          <CardAction>
            {/* Adjust this href to match your routing structure or use a Dialog trigger */}
            <Link href={"/d/production/pipelines/new"}>
              <Button>New Pipeline</Button>
            </Link>
          </CardAction>
        </CardHeader>
      </Card>

      <Card>
        <CardContent>
          <DataTable
            tkey="pipelines"
            columns={columns}
            data={pipelinesData}
            pageCount={pageCount}
            rowCount={rowCount}
          />
        </CardContent>
      </Card>
    </div>
  )
}
