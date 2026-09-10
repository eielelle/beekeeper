import { OutletStoreType } from "@/forms/queries/outlet.query"
import { createAppColumnHelper } from "@/hooks/use-data-table"
import { ColumnSort } from "../core/data-table-column-header"
import { CustomColumnMeta } from "@/types/filter-payloads" // <-- Adjust path to where you saved this interface
import { Button } from "@/components/ui/button"
import { Edit, Eye, Trash } from "lucide-react"
import Link from "next/link"
import { formatSupabaseDate } from "@/lib/helpers/date"
import { DeleteAction } from "../../dialogs/delete-dialog"

const columnHelper = createAppColumnHelper<OutletStoreType>()

export const columns = columnHelper.columns([
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
      filterVariant: "checkbox",
      filterName: "Distributor Status",
      filterOptions: [
        { label: "Distributor", value: "true" },
        { label: "Not Distributor", value: "false" },
      ],
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("is_active", {
    header: (props) => <ColumnSort column={props.column} label="Active" />,
    meta: {
      filterName: "Is Active",
      filterVariant: "checkbox",
      filterOptions: [
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
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

  columnHelper.accessor("region", {
    header: (props) => <ColumnSort column={props.column} label="Region" />,
    meta: {
      filterVariant: "text",
    } as CustomColumnMeta,
  }),

  columnHelper.accessor("created_at", {
    header: (props) => <ColumnSort column={props.column} label="Created At" />,
    cell: ({ getValue }) =>
      formatSupabaseDate(getValue(), {
        preset: "medium",
        includeTime: true,
      }),
    meta: {
      filterName: "Created At",
      filterVariant: "date",
    } as CustomColumnMeta,
  }),

  columnHelper.display({
    id: "actions",
    header: () => <div className="flex h-full items-center">Actions</div>,
    cell: ({ row }) => {
      return (
        <div className="flex gap-1">
          <Link href={`/d/outlets/view/${row.original.id}`}>
            <Button size={"xs"} variant={"ghost"}>
              <Eye />
            </Button>
          </Link>
          <Link href={`/d/outlets/edit/${row.original.id}`}>
            <Button size={"xs"} variant={"ghost"}>
              <Edit />
            </Button>
          </Link>
          <DeleteAction
            id={row.original.id!}
            deleteFn={async (id) => {
              // Implement the actual delete function for outlets
            }}
            queryKeyToInvalidate={["outlets"]}
            entityName="outlet"
          />
        </div>
      )
    },
  }),
])
