import { createAppColumnHelper } from "@/hooks/use-data-table"
import { ColumnSort } from "../core/data-table-column-header"
import { CustomColumnMeta } from "@/types/filter-payloads"
import {
  deleteProductionPipeline,
  ProductionPipelineType,
} from "@/forms/queries/production-pipeline.query"
import { formatSupabaseDate } from "@/lib/helpers/date"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DeleteAction } from "../../dialogs/delete-dialog"

const columnHelper = createAppColumnHelper<ProductionPipelineType>()

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: (props) => (
      <ColumnSort column={props.column} label="Pipeline Name" />
    ),
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
    cell: (props) => {
      return <span className="font-medium">{props.row.original.name}</span>
    },
  }),

  columnHelper.display({
    id: "department",
    header: () => <div className="flex h-full items-center">Department</div>,
    cell: (props) => {
      const dept = props.row.original.department
      if (!dept) return "N/A"
      return (
        <div className="flex flex-col">
          <span>{dept.name}</span>
          <span className="text-xs text-muted-foreground">{dept.code}</span>
        </div>
      )
    },
  }),

  columnHelper.display({
    id: "step_count",
    header: () => <div className="flex h-full items-center">Total Steps</div>,
    cell: (props) => {
      const count = props.row.original.steps?.[0]?.count || 0
      return (
        <Badge variant="secondary" className="font-medium">
          {count} {count === 1 ? "Step" : "Steps"}
        </Badge>
      )
    },
  }),

  columnHelper.accessor("created_at", {
    header: (props) => (
      <ColumnSort column={props.column} label="Date Created" />
    ),
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
    cell: (props) => {
      const createdAt = props.row.original.created_at
      if (!createdAt) return "-"
      return formatSupabaseDate(createdAt, {
        preset: "short",
        includeTime: true,
      })
    },
  }),

  columnHelper.display({
    id: "actions",
    header: () => <div className="flex h-full items-center">Actions</div>,
    cell: ({ row }) => {
      const pipeline = row.original

      return (
        <div className="flex gap-1">
          {/* Adjust the route based on your folder structure */}
          <Link href={`/d/production/pipelines/flow/${pipeline.id}`}>
            <Button size="xs" variant="ghost">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/d/production/pipelines/edit/${pipeline.id}`}>
            <Button size="xs" variant="ghost">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>

          <DeleteAction
            id={row.original.id!}
            deleteFn={async (id) => {
              await deleteProductionPipeline(id.toString())
            }}
            queryKeyToInvalidate={["production-pipelines"]}
            entityName="production pipeline"
          />
        </div>
      )
    },
  }),
])
