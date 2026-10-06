import { useState } from 'react'
import type { FC } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Pencil, Trash2 } from 'lucide-react'
import { expect, fn, screen } from 'storybook/test'
import {
  DataTableAction,
  DataTableActionMenu,
  DataTableActions,
  DataTableConfirmDialog,
  DataTableDialog,
} from '#/components/shared/data-table/data-table-actions'
import { DataTableFrame } from '#/components/shared/data-table/data-table'

const onEdit = fn()
const onDelete = fn()

const ActionsDemo: FC = () => {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <DataTableFrame>
      <DataTableActions>
        <DataTableAction
          label="Ubah 781"
          icon={Pencil}
          onClick={() => {
            onEdit()
            setEditing(true)
          }}
        />
        <DataTableActionMenu
          label="Menu 781"
          items={[
            {
              label: 'Hapus',
              icon: Trash2,
              destructive: true,
              onSelect: () => {
                onDelete()
                setDeleting(true)
              },
            },
          ]}
        />
      </DataTableActions>
      <DataTableDialog
        open={editing}
        onOpenChange={setEditing}
        title="Ubah jenis pakan"
        description="Ubah nama jenis pakan."
      >
        <p>Form ubah</p>
      </DataTableDialog>
      <DataTableConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Hapus 781?"
        description="Jenis pakan ini akan dihapus."
        confirmLabel="Hapus"
        onConfirm={() => setDeleting(false)}
      />
    </DataTableFrame>
  )
}

const meta = {
  title: 'Shared/DataTableActions',
  component: ActionsDemo,
  tags: ['autodocs'],
} satisfies Meta<typeof ActionsDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.hover(canvas.getByRole('button', { name: 'Ubah 781' }))
    await expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Ubah 781',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Ubah 781' }))
    await expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Ubah jenis pakan',
    )
    await expect(onEdit).toHaveBeenCalled()
  },
}
