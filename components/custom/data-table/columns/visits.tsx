import { VisitStoreType } from "@/forms/queries/visit.query"
import { createAppColumnHelper } from "@/hooks/use-data-table"
import { ColumnSort } from "../core/data-table-column-header"
import { CustomColumnMeta } from "@/types/filter-payloads" // <-- Adjust path to where you saved this interface
import { Button } from "@/components/ui/button"
import { Edit, Eye, Trash } from "lucide-react"
import Link from "next/link"
import { formatSupabaseDate } from "@/lib/helpers/date"
import { DeleteAction } from "../../dialogs/delete-dialog"

const columnHelper = createAppColumnHelper<VisitStoreType>()

export const columns = columnHelper.columns([
  columnHelper.accessor("created_at", {
    header: (props) => <ColumnSort column={props.column} label="Created At" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("start_date", {
    header: (props) => <ColumnSort column={props.column} label="Start Date" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("end_date", {
    header: (props) => <ColumnSort column={props.column} label="End Date" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),
])
