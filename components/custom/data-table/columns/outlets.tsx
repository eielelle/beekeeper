import { OutletStoreType } from "@/forms/queries/outlet.query"
import { createAppColumnHelper } from "@/hooks/use-data-table"
import { ColumnSort } from "../core/data-table-column-header"
import { CustomColumnMeta } from "@/types/filter-payloads" // <-- Adjust path to where you saved this interface
import { Button } from "@/components/ui/button"
import { Edit, Trash } from "lucide-react"
import Link from "next/link"

const columnHelper = createAppColumnHelper<OutletStoreType>()

export const columns = columnHelper.columns([
  columnHelper.accessor("created_at", {
    header: (props) => <ColumnSort column={props.column} label="Created At" />,
    meta: {
      filterVariant: "date",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("outlet_code", {
    header: (props) => <ColumnSort column={props.column} label="Outlet Code" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("outlet_name", {
    header: (props) => <ColumnSort column={props.column} label="Outlet Name" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("is_distributor", {
    header: (props) => (
      <ColumnSort column={props.column} label="Is Distributor" />
    ),
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("is_active", {
    header: (props) => <ColumnSort column={props.column} label="Active" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("long", {
    header: (props) => <ColumnSort column={props.column} label="Long" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("lat", {
    header: (props) => <ColumnSort column={props.column} label="Lat" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <Link href={`/d/outlets/edit/${row.original.id}`}>
            <Button size={"xs"} variant={"ghost"}>
              <Edit />
            </Button>
          </Link>
          <Button size={"xs"} variant={"ghost"}>
            <Trash />
          </Button>
        </div>
      )
    },
  }),
])
