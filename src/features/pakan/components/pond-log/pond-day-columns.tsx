import { createAppColumnHelper } from '#/components/shared/data-table'
import {
  formatCalendar,
  formatFasting,
  formatGrams,
  formatPercent,
  formatQuantity,
} from '#/features/pakan/components/pond-log/format-pond'
import type { PondDay } from '#/features/pakan/schemas/kolam'

const column = createAppColumnHelper<PondDay>()

export const pondDayColumns = column.columns([
  column.accessor('date', {
    header: 'Tanggal',
    cell: ({ getValue }) => formatCalendar(getValue()),
  }),
  column.accessor('doc', {
    header: 'DOC',
    cell: ({ getValue }) => getValue(),
  }),
  column.accessor('averageWeightGrams', {
    header: 'Berat (g)',
    cell: ({ getValue }) => formatQuantity(getValue()),
  }),
  column.accessor('frMin', {
    header: 'FR min',
    cell: ({ getValue }) => formatPercent(getValue()),
  }),
  column.accessor('frMax', {
    header: 'FR max',
    cell: ({ getValue }) => formatPercent(getValue()),
  }),
  column.accessor('deaths', {
    header: 'Kematian',
    cell: ({ getValue }) => formatGrams(getValue()),
  }),
  column.accessor('population', {
    header: 'Populasi',
    cell: ({ getValue }) => formatGrams(getValue()),
  }),
  column.accessor('biomassGrams', {
    header: 'Biomassa (g)',
    cell: ({ getValue }) => formatQuantity(getValue()),
  }),
  column.accessor('calculatedFeedGrams', {
    header: 'Pakan hitung (g)',
    cell: ({ getValue }) => formatQuantity(getValue()),
  }),
  column.accessor('operationalFeedGrams', {
    header: 'Pakan operasional (g)',
    cell: ({ getValue }) => formatGrams(getValue()),
  }),
  column.accessor('actualFeedGrams', {
    header: 'Pakan aktual (g)',
    cell: ({ getValue }) => formatGrams(getValue()),
  }),
  column.accessor('fastingReason', {
    header: 'Puasa',
    cell: ({ getValue }) => formatFasting(getValue()),
  }),
])
