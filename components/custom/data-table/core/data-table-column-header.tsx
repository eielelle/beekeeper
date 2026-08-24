import type { Header, TableFeatures } from "@tanstack/react-table"

interface DataTableColumnHeaderProps<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue = unknown,
> {
  header: Header<TFeatures, TData, TValue>
  title: string
}

export default function DataTableColumnHeader<
  TFeatures extends TableFeatures,
  TData,
  TValue = unknown,
>({ header, title }: DataTableColumnHeaderProps<TFeatures, TData, TValue>) {
  const column = header.column

  if (!column.getCanSort()) {
    return <div>{title}</div>
  }

  const isSorted = column.getIsSorted()

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span>{title}</span>
      <div>
        <button
          type="button"
          onClick={() => column.toggleSorting(false)}
          style={{ fontWeight: isSorted === "asc" ? "bold" : "normal" }}
        >
          ▲ Asc
        </button>
        <button
          type="button"
          onClick={() => column.toggleSorting(true)}
          style={{ fontWeight: isSorted === "desc" ? "bold" : "normal" }}
        >
          ▼ Desc
        </button>
        {isSorted ? (
          <button type="button" onClick={() => column.clearSorting()}>
            ✕
          </button>
        ) : null}
      </div>
    </div>
  )
}
