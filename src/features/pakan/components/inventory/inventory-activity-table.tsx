import type { FC } from 'react'
import { Link } from '@tanstack/react-router'
import {
  DataTableFrame,
  createAppColumnHelper,
  useAppTable,
} from '#/components/shared/data-table'
import type { ServerTableControls } from '#/components/shared/data-table'
import { formatDateTime } from '#/helpers/format-date'
import { Badge } from '#/components/ui/badge'
import { InventoryFilterCombobox } from '#/features/pakan/components/inventory/inventory-filter-combobox'
import { formatGrams } from '#/features/pakan/components/pond-log/format-pond'
import { cn } from '#/lib/utils'
import type {
  ActivityRow,
  InventoryActivityType,
} from '#/features/pakan/schemas/inventory'

const column = createAppColumnHelper<ActivityRow>()

const typeLabel: Record<InventoryActivityType, string> = {
  receipt: 'Tambah',
  bibis: 'Bibis disiapkan',
  application: 'Pakan aktual',
  opname: 'Opname',
}

const typeBadge = {
  receipt: 'success',
  bibis: 'accent',
  application: 'info',
  opname: 'warning',
} as const

function quantitySign(row: ActivityRow) {
  if (row.type === 'application') return row.quantityGrams === 0 ? 0 : -1
  if (row.type === 'opname') return Math.sign(row.quantityGrams)
  return row.quantityGrams === 0 ? 0 : 1
}

function signedGrams(row: ActivityRow): string {
  const amount = formatGrams(Math.abs(row.quantityGrams))
  if (row.type === 'application') return `−${amount}`
  if (row.type === 'opname') {
    if (row.quantityGrams > 0) return `+${amount}`
    if (row.quantityGrams < 0) return `−${amount}`
    return amount
  }
  return `+${amount}`
}

const typeOptions: Array<{ value: InventoryActivityType; label: string }> = [
  { value: 'receipt', label: 'Tambah' },
  { value: 'bibis', label: 'Bibis' },
  { value: 'application', label: 'Pakan aktual' },
  { value: 'opname', label: 'Opname' },
]

interface InventoryActivityTableProps {
  rows: Array<ActivityRow>
  rowCount?: number
  server?: ServerTableControls
  type: InventoryActivityType | 'all'
  onTypeChange: (type: InventoryActivityType | 'all') => void
  feeds?: Array<{ value: string; label: string }>
  feedId?: string | null
  onFeedIdChange?: (feedId: string | null) => void
  isLoading?: boolean
  isFetching?: boolean
}

export const InventoryActivityTable: FC<InventoryActivityTableProps> = ({
  rows,
  rowCount,
  server,
  type,
  onTypeChange,
  feeds = [],
  feedId = null,
  onFeedIdChange,
  isLoading = false,
  isFetching = false,
}) => {
  const table = useAppTable({
    data: rows,
    columns: column.columns([
      column.accessor('occurredAt', {
        header: 'Waktu',
        cell: ({ getValue }) => formatDateTime(getValue()),
      }),
      column.accessor('type', {
        header: 'Kegiatan',
        cell: ({ getValue }) => {
          const type = getValue()
          return (
            <Badge variant={typeBadge[type]} size="sm">
              {typeLabel[type]}
            </Badge>
          )
        },
      }),
      column.accessor('feedName', { header: 'Jenis pakan' }),
      column.accessor('quantityGrams', {
        header: 'Jumlah (g)',
        cell: ({ row }) => {
          const sign = quantitySign(row.original)
          return (
            <span
              className={cn(
                'block text-right font-medium tabular-nums',
                sign > 0 && 'text-success-foreground',
                sign < 0 && 'text-destructive',
              )}
            >
              {signedGrams(row.original)}
            </span>
          )
        },
      }),
      column.accessor('pondCode', {
        header: 'Kolam',
        enableSorting: false,
        cell: ({ getValue }) => {
          const code = getValue()
          if (!code) return '—'
          return (
            <Link
              to="/kolam/$pondCode"
              params={{ pondCode: code }}
              className="underline-offset-4 hover:underline"
            >
              {code}
            </Link>
          )
        },
      }),
      column.accessor('userName', { header: 'Oleh', enableSorting: false }),
      column.accessor('note', {
        header: 'Catatan',
        enableSorting: false,
        cell: ({ getValue }) => getValue() || '—',
      }),
    ]),
    ...(server ? { ...server, rowCount: rowCount ?? rows.length } : {}),
    getRowId: (row) => row.id,
    enableRowSelection: false,
    enableSortingRemoval: false,
  })

  return (
    <DataTableFrame>
      <table.AppTable>
        <table.Toolbar>
          <InventoryFilterCombobox
            label="Kegiatan"
            value={type === 'all' ? null : type}
            allLabel="Semua kegiatan"
            options={typeOptions}
            onChange={(next) =>
              onTypeChange((next as InventoryActivityType | null) ?? 'all')
            }
          />
          {feeds.length > 0 ? (
            <InventoryFilterCombobox
              label="Jenis pakan riwayat"
              value={feedId}
              allLabel="Semua jenis"
              options={feeds}
              onChange={(next) => onFeedIdChange?.(next)}
            />
          ) : null}
          <table.Search label="Cari riwayat" className="w-56 max-w-none" />
        </table.Toolbar>
        <div className="min-w-0 overflow-x-auto">
          <table.Grid
            className="max-h-none"
            emptyLabel="Belum ada pergerakan stok."
            isLoading={isLoading}
            isFetching={isFetching}
          />
        </div>
        <table.Pagination />
      </table.AppTable>
    </DataTableFrame>
  )
}
