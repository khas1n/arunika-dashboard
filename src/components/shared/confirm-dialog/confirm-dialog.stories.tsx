import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn, screen } from 'storybook/test'
import { ConfirmDialog } from '#/components/shared/confirm-dialog/confirm-dialog'

const meta = {
  title: 'Shared/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: fn(),
    title: 'Hapus 781?',
    description: 'Jenis pakan ini akan dihapus.',
    confirmLabel: 'Hapus',
    onConfirm: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async ({ args, userEvent }) => {
    await screen.findByRole('alertdialog')
    await userEvent.click(screen.getByRole('button', { name: 'Hapus' }))
    await expect(args.onConfirm).toHaveBeenCalled()
  },
}

export const Error: Story = {
  args: { error: 'Jenis pakan ini masih dipakai.' },
}
