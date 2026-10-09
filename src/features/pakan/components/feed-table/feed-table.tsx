import { useState } from 'react'
import type { FC } from 'react'
import { Trash2 } from 'lucide-react'
import {
  DataTableConfirmDialog,
  DataTableDialog,
  DataTableFrame,
  DataTableSelectionBar,
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
  const [bulkIds, setBulkIds] = useState<Array<string>>([])
  const [pendingDelete, setPendingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string>()
  const table = useAppTable({
    data: rows,
    columns: feedColumns,
    ...(server ? { ...server, rowCount: rowCount ?? rows.length } : {}),
    getRowId: (row) => row.id,
    enableRowSelection: (row) => row.original.usageCount === 0,
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
        <DataTableSelectionBar
          actionLabel="Hapus"
          icon={Trash2}
          destructive
          pending={pendingDelete}
          onAction={(ids) => {
            setDeleteError(undefined)
            setBulkIds(ids)
          }}
        >
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
        </DataTableSelectionBar>
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
        <DataTableConfirmDialog
          open={bulkIds.length > 0}
          onOpenChange={(open) => {
            if (!open && !pendingDelete) {
              setBulkIds([])
              setDeleteError(undefined)
            }
          }}
          title={`Hapus ${bulkIds.length} jenis pakan?`}
          description="Hanya jenis pakan yang belum dipakai yang terpilih. Yang sudah dipakai di catatan tetap."
          confirmLabel="Hapus"
          pending={pendingDelete}
          error={deleteError}
          onConfirm={() => {
            const ids = bulkIds
            setPendingDelete(true)
            setDeleteError(undefined)
            void (async () => {
              const failed: Array<string> = []
              let message: string | undefined
              for (const id of ids) {
                try {
                  await onDelete(id)
                } catch (error: unknown) {
                  failed.push(id)
                  message ??=
                    error instanceof Error
                      ? error.message
                      : 'Terjadi kesalahan. Coba lagi.'
                }
              }
              table.setRowSelection(
                Object.fromEntries(failed.map((id) => [id, true])),
              )
              if (failed.length === 0) setBulkIds([])
              else {
                setBulkIds(failed)
                setDeleteError(message)
              }
            })().finally(() => {
              setPendingDelete(false)
            })
          }}
        />
      </DataTableFrame>
    </FeedRowActionsProvider>
  )
}
