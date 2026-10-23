import { useState } from 'react'
import type { FC } from 'react'
import {
  createAppColumnHelper,
  DataTableFrame,
  useAppTable,
} from '#/components/shared/data-table'
import { Button } from '#/components/ui/button'
import { InventoryFilterCombobox } from '#/features/pakan/components/inventory/inventory-filter-combobox'
import { formatGrams } from '#/features/pakan/components/pond-log/format-pond'
import type { StockRow } from '#/features/pakan/schemas/inventory'

const column = createAppColumnHelper<StockRow>()

function grams(value: number) {
  return (
    <span className="block text-right tabular-nums">{formatGrams(value)}</span>
  )
}

interface InventoryStockTableProps {
  rows: Array<StockRow>
  isLoading?: boolean
  onReceive: (row: StockRow) => void
  onCount: (row: StockRow) => void
}

export const InventoryStockTable: FC<InventoryStockTableProps> = ({
  rows,
  isLoading = false,
  onReceive,
  onCount,
}) => {
  const [feedId, setFeedId] = useState<string | null>(null)
  const visible = feedId ? rows.filter((row) => row.feedId === feedId) : rows
  const table = useAppTable({
    data: visible,
    columns: column.columns([
      column.accessor('feedName', { header: 'Jenis pakan' }),
      column.accessor('stockGrams', {
        header: 'Stok (g)',
        cell: ({ getValue }) => grams(getValue()),
      }),
      column.display({
        id: 'stock-actions',
        header: 'Aksi',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onReceive(row.original)}
            >
              Tambah
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onCount(row.original)}
            >
              Opname
            </Button>
          </div>
        ),
      }),
    ]),
    getRowId: (row) => row.feedId,
    enableRowSelection: false,
  })

  return (
    <DataTableFrame>
      <table.AppTable>
        <table.Toolbar>
          <InventoryFilterCombobox
            label="Jenis pakan"
            value={feedId}
            allLabel="Semua jenis"
            options={rows.map((row) => ({
              value: row.feedId,
              label: row.feedName,
            }))}
            onChange={setFeedId}
          />
        </table.Toolbar>
        <div className="min-w-0 overflow-x-auto">
          <table.Grid
            className="max-h-none"
            emptyLabel="Belum ada jenis pakan."
            isLoading={isLoading}
          />
        </div>
      </table.AppTable>
    </DataTableFrame>
  )
}
