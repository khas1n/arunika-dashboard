import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'

import { FeedManager } from './feed-manager'

const createdAt = new Date('2026-10-01T00:00:00Z')

const meta = {
  title: 'Pakan/FeedManager',
  component: FeedManager,
  tags: ['autodocs'],
  args: {
    feeds: [
      { id: 'feed-1', name: '781', createdAt, usageCount: 0 },
      { id: 'feed-2', name: 'Safir', createdAt, usageCount: 4 },
    ],
    onCreate: fn(async () => {}),
    onUpdate: fn(async () => {}),
    onDelete: fn(async () => {}),
  },
} satisfies Meta<typeof FeedManager>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  args: { feeds: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Belum ada jenis pakan.')).toBeVisible()
  },
}

export const InUseCannotBeDeleted: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Dipakai di 4 catatan')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'Hapus Safir' }),
    ).toBeDisabled()
  },
}

export const Add: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Nama jenis pakan'), 'Starter')
    await userEvent.click(canvas.getByRole('button', { name: 'Tambah' }))
    await expect(args.onCreate).toHaveBeenCalledWith({ name: 'Starter' })
  },
}

export const Edit: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Ubah 781' }))
    const [, editInput] = canvas.getAllByLabelText('Nama jenis pakan')
    await userEvent.clear(editInput)
    await userEvent.type(editInput, '781 Premium')
    await userEvent.click(canvas.getByRole('button', { name: 'Simpan' }))
    await expect(args.onUpdate).toHaveBeenCalledWith({
      id: 'feed-1',
      name: '781 Premium',
    })
  },
}

export const EditCancelled: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Ubah 781' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Batal' }))
    await expect(canvas.getByRole('button', { name: 'Ubah 781' })).toBeVisible()
    await expect(args.onUpdate).not.toHaveBeenCalled()
  },
}

export const Delete: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Hapus 781' }))
    await expect(canvas.getByText('Hapus 781?')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Hapus' }))
    await expect(args.onDelete).toHaveBeenCalledWith('feed-1')
  },
}

export const DeleteFailed: Story = {
  args: {
    onDelete: fn(async () => {
      throw new Error('Jenis pakan sudah dipakai dan tidak bisa dihapus.')
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Hapus 781' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Hapus' }))
    await expect(
      await canvas.findByText(
        'Jenis pakan sudah dipakai dan tidak bisa dihapus.',
      ),
    ).toBeVisible()
  },
}

export const AddFailed: Story = {
  args: {
    onCreate: fn(async () => {
      throw new Error('Jenis pakan dengan nama ini sudah ada.')
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Nama jenis pakan'), 'Safir')
    await userEvent.click(canvas.getByRole('button', { name: 'Tambah' }))
    await expect(
      await canvas.findByText('Jenis pakan dengan nama ini sudah ada.'),
    ).toBeVisible()
  },
}
