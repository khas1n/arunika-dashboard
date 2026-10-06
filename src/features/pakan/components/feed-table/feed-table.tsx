import { useState } from 'react'
import type { FC } from 'react'
import {
  DataTableConfirmDialog,
  DataTableDialog,
  DataTableFrame,
  useAppTable,
} from '#/components/shared/data-table'
import type { ServerTableControls } from '#/components/shared/data-table'
import { feedColumns } from '#/features/pakan/components/feed-table/feed-columns'
import { FeedRowActionsProvider } from '#/features/pakan/components/feed-table/feed-row-actions'
import type { FeedRowActions } from '#/features/pakan/components/feed-table/feed-row-actions'
import { FeedForm } from '#/features/pakan/components/feed-form'
import type { FeedItem, FeedUpdateInput } from '#/features/pakan/schemas/feed'

interface FeedTableProps {
  rows: Array<FeedItem>
  rowCount?: number
  server?: ServerTableControls
  isLoading?: boolean
  isFetching?: boolean
  onUpdate: (values: FeedUpdateInput) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export const FeedTable: FC<FeedTableProps> = ({
  rows,
  rowCount,
  server,
  isLoading = false,
  isFetching = false,
  onUpdate,
  onDelete,
}) => {
  const [editing, setEditing] = useState<FeedItem>()
  const [deleting, setDeleting] = useState<FeedItem>()
  const [pendingDelete, setPendingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string>()
  const table = useAppTable({
    data: rows,
    columns: feedColumns,
    ...(server ? { ...server, rowCount: rowCount ?? rows.length } : {}),
    getRowId: (row) => row.id,
  })

  const actions: FeedRowActions = {
    edit: (feed) => {
      setDeleteError(undefined)
      setEditing(feed)
    },
    askDelete: (feed) => {
      setDeleteError(undefined)
      setDeleting(feed)
    },
  }

  return (
    <FeedRowActionsProvider value={actions}>
      <DataTableFrame>
        <table.AppTable>
          <table.Toolbar>
            <table.Search label="Cari jenis pakan" />
            <table.ViewOptions />
          </table.Toolbar>
          <table.Grid
            emptyLabel="Belum ada jenis pakan."
            isLoading={isLoading}
            isFetching={isFetching}
          />
          <table.Pagination />
        </table.AppTable>
        <DataTableDialog
          open={editing != null}
          onOpenChange={(open) => {
            if (!open) setEditing(undefined)
          }}
          title="Ubah jenis pakan"
          description={
            editing ? `Ubah nama ${editing.name}.` : 'Ubah nama jenis pakan.'
          }
        >
          {editing ? (
            <FeedForm
              key={editing.id}
              defaultName={editing.name}
              submitLabel="Simpan"
              onCancel={() => setEditing(undefined)}
              onSubmit={async (values) => {
                await onUpdate({ id: editing.id, ...values })
                setEditing(undefined)
              }}
            />
          ) : null}
        </DataTableDialog>
        <DataTableConfirmDialog
          open={deleting != null}
          onOpenChange={(open) => {
            if (!open && !pendingDelete) {
              setDeleting(undefined)
              setDeleteError(undefined)
            }
          }}
          title={deleting ? `Hapus ${deleting.name}?` : 'Hapus jenis pakan?'}
          description="Jenis pakan yang belum dipakai akan dihapus."
          confirmLabel="Hapus"
          pending={pendingDelete}
          error={deleteError}
          onConfirm={() => {
            if (!deleting) return
            const id = deleting.id
            setPendingDelete(true)
            setDeleteError(undefined)
            void onDelete(id)
              .then(() => {
                setDeleting(undefined)
              })
              .catch((error: unknown) => {
                setDeleteError(
                  error instanceof Error
                    ? error.message
                    : 'Terjadi kesalahan. Coba lagi.',
                )
              })
              .finally(() => {
                setPendingDelete(false)
              })
          }}
        />
      </DataTableFrame>
    </FeedRowActionsProvider>
  )
}
