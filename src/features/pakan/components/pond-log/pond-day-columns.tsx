import { createAppColumnHelper } from '#/components/shared/data-table'
import { StatusBadge } from '#/components/ui/badge'
import {
  formatCalendar,
  formatGrams,
  formatPercent,
  formatQuantity,
} from '#/features/pakan/components/pond-log/format-pond'
import { DayNumberCell } from '#/features/pakan/components/pond-log/pond-day-cell'
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
    enableSorting: false,
    enablePinning: false,
  }),
  column.accessor('averageWeightGrams', {
    header: 'Berat (g)',
    cell: ({ row }) => (
      <DayNumberCell
        day={row.original}
        field="averageWeightGrams"
        label="Berat"
        format={formatQuantity}
        fractionDigits={3}
      />
    ),
  }),
  column.accessor('frMin', {
    header: 'FR min',
    cell: ({ row }) => (
      <DayNumberCell
        day={row.original}
        field="frMin"
        label="FR min"
        format={formatPercent}
        fractionDigits={2}
        scale={100}
        max={100}
        suffix="%"
      />
    ),
  }),
  column.accessor('frMax', {
    header: 'FR max',
    cell: ({ row }) => (
      <DayNumberCell
        day={row.original}
        field="frMax"
        label="FR max"
        format={formatPercent}
        fractionDigits={2}
        scale={100}
        max={100}
        suffix="%"
      />
    ),
  }),
  column.accessor('deaths', {
    header: 'Kematian',
    cell: ({ row }) => (
      <DayNumberCell
        day={row.original}
        field="deaths"
        label="Kematian"
        format={formatGrams}
        emptyValue={0}
      />
    ),
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
    cell: ({ row }) => (
      <DayNumberCell
        day={row.original}
        field="actualFeedGrams"
        label="Pakan aktual"
        format={formatGrams}
        emptyValue={0}
      />
    ),
  }),
  column.accessor('fastingReason', {
    header: 'Puasa',
    cell: ({ getValue }) => {
      const value = getValue()
      if (value === 'dadakan')
        return <StatusBadge variant="warning">Dadakan</StatusBadge>
      if (value === 'pola')
        return <StatusBadge variant="info">Pola</StatusBadge>
      return '—'
    },
  }),
])
