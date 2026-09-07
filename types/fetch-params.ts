import { FilterPayload } from "./filter-payloads"

export type FetchParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
  columnFilters?: { id: string; value: FilterPayload }[]
}
