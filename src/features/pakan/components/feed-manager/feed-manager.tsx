import type { FC } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import type { ServerTableControls } from '#/components/shared/data-table'
import { FeedForm } from '#/features/pakan/components/feed-form'
import { FeedTable } from '#/features/pakan/components/feed-table'
import type {
  FeedInput,
  FeedItem,
  FeedUpdateInput,
} from '#/features/pakan/schemas/feed'

interface FeedManagerProps {
  feeds: Array<FeedItem>
  rowCount?: number
  server?: ServerTableControls
  isLoading?: boolean
  isFetching?: boolean
  onCreate: (values: FeedInput) => Promise<unknown>
  onUpdate: (values: FeedUpdateInput) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export const FeedManager: FC<FeedManagerProps> = ({
  feeds,
  rowCount,
  server,
  isLoading = false,
  isFetching = false,
  onCreate,
  onUpdate,
  onDelete,
}) => {
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
        <FeedTable
          rows={feeds}
          rowCount={rowCount}
          server={server}
          isLoading={isLoading}
          isFetching={isFetching}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  )
}
