import {
  aggregationFn_count,
  aggregationFn_sum,
  cellSelectionFeature,
  cellSpanningFeature,
  columnFacetingFeature,
  columnFilteringFeature,
  columnGroupingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFacetedMinMaxValues,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowPinningFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
} from '@tanstack/react-table'

/**
 * Every stock feature the shared table can exercise.
 *
 * Registered by name, with the row-model slot each feature needs, instead of
 * `stockFeatures`. A screen turns a feature on by setting its state or column
 * option. Client tables run these row models. Server tables set `manual*` and
 * keep the same registration so pinning, sizing, selection, and spanning still
 * run on the page the API returned.
 *
 * Slot order follows the feature that owns the slot: sizing before resizing,
 * filtering before global filtering, sorting before the sorted row model.
 */
export const dataTableFeatures = tableFeatures({
  columnSizingFeature,
  columnResizingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  columnFacetingFeature,
  columnGroupingFeature,
  rowSortingFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowPinningFeature,
  rowSelectionFeature,
  cellSelectionFeature,
  cellSpanningFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  groupedRowModel: createGroupedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
  filterFns: {
    includesString: filterFn_includesString,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
  },
  aggregationFns: {
    sum: aggregationFn_sum,
    count: aggregationFn_count,
  },
})
