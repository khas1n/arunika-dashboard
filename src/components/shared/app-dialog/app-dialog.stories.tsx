import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn, screen } from 'storybook/test'
import { AppDialog } from '#/components/shared/app-dialog/app-dialog'

const meta = {
  title: 'Shared/AppDialog',
  component: AppDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: fn(),
    title: 'Ubah jenis pakan',
    description: 'Ubah nama jenis pakan.',
    children: 'Form ubah',
  },
} satisfies Meta<typeof AppDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async () => {
    await expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Ubah jenis pakan',
    )
  },
}
