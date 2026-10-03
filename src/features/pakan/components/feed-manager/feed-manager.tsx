import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { FeedForm } from '#/features/pakan/components/feed-form'
import type {
  FeedInput,
  FeedItem,
  FeedUpdateInput,
} from '#/features/pakan/schemas/feed'

type RowMode = 'view' | 'edit' | 'confirmDelete'

function FeedRow({
  feed,
  mode,
  deleting,
  onEdit,
  onAskDelete,
  onCancel,
  onUpdate,
  onConfirmDelete,
}: {
  feed: FeedItem
  mode: RowMode
  deleting: boolean
  onEdit: () => void
  onAskDelete: () => void
  onCancel: () => void
  onUpdate: (values: FeedInput) => Promise<unknown>
  onConfirmDelete: () => void
}) {
  if (mode === 'edit') {
    return (
      <li className="py-3">
        <FeedForm
          defaultName={feed.name}
          submitLabel="Simpan"
          onSubmit={onUpdate}
          onCancel={onCancel}
        />
      </li>
    )
  }

  if (mode === 'confirmDelete') {
    return (
      <li className="flex flex-wrap items-center justify-between gap-3 py-3">
        <span className="text-sm">Hapus {feed.name}?</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            loading={deleting}
            onClick={onConfirmDelete}
          >
            Hapus
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={deleting}
            onClick={onCancel}
          >
            Batal
          </Button>
        </div>
      </li>
    )
  }

  const inUse = feed.usageCount > 0

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="grid gap-0.5">
        <span className="text-sm font-medium">{feed.name}</span>
        {inUse ? (
          <span className="text-xs text-muted-foreground">
            Dipakai di {feed.usageCount} catatan
          </span>
        ) : null}
      </div>
      <div className="flex gap-1">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Ubah ${feed.name}`}
          onClick={onEdit}
        >
          <Pencil />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Hapus ${feed.name}`}
          disabled={inUse}
          onClick={onAskDelete}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  )
}

export function FeedManager({
  feeds,
  onCreate,
  onUpdate,
  onDelete,
}: {
  feeds: Array<FeedItem>
  onCreate: (values: FeedInput) => Promise<unknown>
  onUpdate: (values: FeedUpdateInput) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}) {
  const [active, setActive] = useState<{ id: string; mode: RowMode }>()
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string>()

  const cancel = () => {
    setActive(undefined)
    setDeleteError(undefined)
  }

  const confirmDelete = async (id: string) => {
    setDeleting(true)
    setDeleteError(undefined)
    try {
      await onDelete(id)
      setActive(undefined)
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan. Coba lagi.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jenis pakan</CardTitle>
        <CardDescription>
          Daftar jenis pakan. Tambah, ubah nama, atau hapus yang belum dipakai.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <FeedForm submitLabel="Tambah" onSubmit={onCreate} />

        {deleteError ? (
          <Alert variant="destructive">
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        ) : null}

        {feeds.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada jenis pakan.
          </p>
        ) : (
          <ul className="divide-y">
            {feeds.map((feed) => (
              <FeedRow
                key={feed.id}
                feed={feed}
                mode={active?.id === feed.id ? active.mode : 'view'}
                deleting={deleting && active?.id === feed.id}
                onEdit={() => {
                  setDeleteError(undefined)
                  setActive({ id: feed.id, mode: 'edit' })
                }}
                onAskDelete={() => {
                  setDeleteError(undefined)
                  setActive({ id: feed.id, mode: 'confirmDelete' })
                }}
                onCancel={cancel}
                onUpdate={async (values) => {
                  await onUpdate({ id: feed.id, ...values })
                  setActive(undefined)
                }}
                onConfirmDelete={() => void confirmDelete(feed.id)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
