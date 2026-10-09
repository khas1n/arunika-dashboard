import { createContext, use } from 'react'
import type { FC, ReactNode } from 'react'
import { Ban, Timer } from 'lucide-react'
import {
  createAppColumnHelper,
  DataTableAction,
  DataTableActions,
  DataTableSelectAll,
  DataTableSelectRow,
} from '#/components/shared/data-table'
import { StatusBadge } from '#/components/ui/badge'
import { formatCalendar } from '#/features/pakan/components/pond-log/format-pond'
import type { FastingOverrideItem } from '#/features/pakan/schemas/kolam'

const endOverride = createContext<((row: FastingOverrideItem) => void) | null>(
  null,
)

export const OverrideEndProvider: FC<{
  onEnd: (row: FastingOverrideItem) => void
  children: ReactNode
}> = ({ onEnd, children }) => {
  return <endOverride.Provider value={onEnd}>{children}</endOverride.Provider>
}

const EndCell: FC<{ row: FastingOverrideItem }> = ({ row }) => {
  const onEnd = use(endOverride)
  if (row.ended || onEnd == null) return null
  return (
    <DataTableActions>
      <DataTableAction label="Akhiri" icon={Ban} onClick={() => onEnd(row)} />
    </DataTableActions>
  )
}

const column = createAppColumnHelper<FastingOverrideItem>()

export const overrideColumns = column.columns([
  column.display({
    id: 'select',
    size: 40,
    minSize: 40,
    maxSize: 48,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    enablePinning: false,
    enableCellSelection: false,
    header: () => <DataTableSelectAll />,
    cell: ({ row }) => (
      <DataTableSelectRow row={row} label={`Pilih ${row.original.reason}`} />
    ),
  }),
  column.accessor('startsOn', {
    header: 'Mulai',
    cell: ({ getValue }) => formatCalendar(getValue()),
  }),
  column.accessor('endsOn', {
    header: 'Selesai',
    enableSorting: false,
    cell: ({ getValue }) => formatCalendar(getValue()),
  }),
  column.accessor('reason', {
    header: 'Alasan',
  }),
  column.accessor('ended', {
    id: 'status',
    header: 'Status',
    cell: ({ getValue }) =>
      getValue() ? (
        <StatusBadge variant="destructive">Diakhiri</StatusBadge>
      ) : (
        <StatusBadge variant="success" icon={Timer}>
          Aktif
        </StatusBadge>
      ),
  }),
  column.display({
    id: 'actions',
    size: 96,
    minSize: 96,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    enablePinning: false,
    enableCellSelection: false,
    header: 'Aksi',
    cell: ({ row }) => <EndCell row={row.original} />,
  }),
])
