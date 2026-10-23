import { useState } from 'react'
import type { FC } from 'react'
import {
  createAppColumnHelper,
  DataTableFrame,
  useAppTable,
} from '#/components/shared/data-table'
import { Button } from '#/components/ui/button'
import { InventoryFilterCombobox } from '#/features/pakan/components/inventory/inventory-filter-combobox'
import { InventoryStatus } from '#/features/pakan/components/inventory/inventory-status'
import { InventoryStockMeter } from '#/features/pakan/components/inventory/inventory-stock-meter'
import type { BibisRow } from '#/features/pakan/schemas/inventory'

const column = createAppColumnHelper<BibisRow>()

interface InventoryBibisTableProps {
  rows: Array<BibisRow>
  isLoading?: boolean
  onPrepare: (row: BibisRow) => void
}

export const InventoryBibisTable: FC<InventoryBibisTableProps> = ({
  rows,
  isLoading = false,
  onPrepare,
}) => {
  const [feedId, setFeedId] = useState<string | null>(null)
  const visible = feedId ? rows.filter((row) => row.feedId === feedId) : rows
  const feeds = rows.filter(
    (row, index) =>
      rows.findIndex((item) => item.feedId === row.feedId) === index,
  )
  const table = useAppTable({
    data: visible,
    columns: column.columns([
      column.accessor('feedName', { header: 'Jenis pakan' }),
      column.accessor('stockGrams', {
        header: 'Stok (g)',
        size: 280,
        minSize: 200,
        cell: ({ row }) => (
          <InventoryStockMeter
            requiredGrams={row.original.requiredGrams}
            stockGrams={row.original.stockGrams}
          />
        ),
      }),
      column.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => <InventoryStatus status={getValue()} />,
      }),
      column.display({
        id: 'prepare',
        header: 'Aksi',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onPrepare(row.original)}
            >
              Tambah
            </Button>
          </div>
        ),
      }),
    ]),
    getRowId: (row) => `${row.feedId}:${row.feedingOn ?? 'none'}`,
    enableRowSelection: false,
  })

  return (
    <DataTableFrame>
      <table.AppTable>
        <table.Toolbar>
          <InventoryFilterCombobox
            label="Jenis pakan bibis"
            value={feedId}
            allLabel="Semua jenis"
            options={feeds.map((row) => ({
              value: row.feedId,
              label: row.feedName,
            }))}
            onChange={setFeedId}
          />
        </table.Toolbar>
        <div className="min-w-0 overflow-x-auto">
          <table.Grid
            className="max-h-none"
            emptyLabel="Belum ada bibis."
            isLoading={isLoading}
          />
        </div>
      </table.AppTable>
    </DataTableFrame>
  )
}
