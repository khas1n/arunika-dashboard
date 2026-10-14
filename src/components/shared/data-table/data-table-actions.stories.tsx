import type { FC } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Pencil, Trash2 } from 'lucide-react'
import { expect, fn, screen } from 'storybook/test'
import {
  DataTableAction,
  DataTableActionMenu,
  DataTableActions,
} from '#/components/shared/data-table/data-table-actions'
import { DataTableFrame } from '#/components/shared/data-table/data-table'

const onEdit = fn()
const onDelete = fn()

const ActionsDemo: FC = () => {
  return (
    <DataTableFrame>
      <DataTableActions>
        <DataTableAction label="Ubah 781" icon={Pencil} onClick={onEdit} />
        <DataTableActionMenu
          label="Menu 781"
          items={[
            {
              label: 'Hapus',
              icon: Trash2,
              destructive: true,
              onSelect: onDelete,
            },
          ]}
        />
      </DataTableActions>
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
    await expect(onEdit).toHaveBeenCalled()
  },
}
