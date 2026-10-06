import type { FC } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import {
  createAppColumnHelper,
  DataTableAction,
  DataTableActions,
  DataTableSelectAll,
  DataTableSelectRow,
} from '#/components/shared/data-table'
import { Badge } from '#/components/ui/badge'
import { formatDate } from '#/helpers/format-date'
import type { FeedItem } from '#/features/pakan/schemas/feed'
import { useFeedRowActions } from '#/features/pakan/components/feed-table/feed-row-actions'

const column = createAppColumnHelper<FeedItem>()

interface FeedActionsCellProps {
  feed: FeedItem
}

const FeedActionsCell: FC<FeedActionsCellProps> = ({ feed }) => {
  const actions = useFeedRowActions()

  return (
    <DataTableActions>
      <DataTableAction
        label={`Ubah ${feed.name}`}
        icon={Pencil}
        onClick={() => actions.edit(feed)}
      />
      <DataTableAction
        label={`Hapus ${feed.name}`}
        icon={Trash2}
        disabled={feed.usageCount > 0}
        onClick={() => actions.askDelete(feed)}
      />
    </DataTableActions>
  )
}

export const feedColumns = column.columns([
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
      <DataTableSelectRow row={row} label={`Pilih ${row.original.name}`} />
    ),
  }),
  column.accessor('name', {
    header: 'Nama',
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  column.accessor('createdAt', {
    header: 'Dibuat',
    cell: ({ getValue }) => formatDate(getValue()),
  }),
  column.accessor('usageCount', {
    header: 'Pemakaian',
    enableSorting: false,
    cell: ({ getValue }) => {
      const count = getValue()
      if (count === 0) return <Badge variant="secondary">Belum dipakai</Badge>
      return <Badge variant="outline">Dipakai di {count} catatan</Badge>
    },
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
    cell: ({ row }) => <FeedActionsCell feed={row.original} />,
  }),
])
