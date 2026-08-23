import {
  columnVisibilityFeature,
  createSortedRowModel,
  createTableHook,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table"

export const features = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
})

export const { useAppTable, createAppColumnHelper } = createTableHook({
  features,
  enableSortingRemoval: false,
  manualPagination: true,
})

export type DataTableFeatures = typeof features
