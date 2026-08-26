import {
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createSortedRowModel,
  createTableHook,
  rowPaginationFeature,
  rowPinningFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table"

export const features = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowPinningFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnOrderingFeature,
  sortedRowModel: createSortedRowModel(),
})

export const { useAppTable, createAppColumnHelper } = createTableHook({
  features,
  enableSortingRemoval: false,
  manualPagination: true,
  manualSorting: true,
  keepPinnedRows: true,
})

export type DataTableFeatures = typeof features
