import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'

import { FeedForm } from './feed-form'

const meta = {
  title: 'Pakan/FeedForm',
  component: FeedForm,
  tags: ['autodocs'],
  args: {
    submitLabel: 'Tambah',
    onSubmit: fn(async () => {}),
  },
} satisfies Meta<typeof FeedForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Editing: Story = {
  args: { defaultName: 'Safir', submitLabel: 'Simpan', onCancel: fn() },
}

export const ValidationError: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Tambah' }))
    await expect(canvas.getByText('Nama jenis pakan wajib diisi')).toBeVisible()
  },
}

export const SubmitsTrimmedName: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Nama jenis pakan'), '  781  ')
    await userEvent.click(canvas.getByRole('button', { name: 'Tambah' }))
    await expect(args.onSubmit).toHaveBeenCalledWith({ name: '781' })
  },
}

export const ServerError: Story = {
  args: {
    onSubmit: fn(async () => {
      throw new Error('Jenis pakan dengan nama ini sudah ada.')
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Nama jenis pakan'), 'Safir')
    await userEvent.click(canvas.getByRole('button', { name: 'Tambah' }))
    await expect(
      canvas.getByText('Jenis pakan dengan nama ini sudah ada.'),
    ).toBeVisible()
  },
}

export const Submitting: Story = {
  args: { onSubmit: fn(() => new Promise(() => {})) },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Nama jenis pakan'), 'Safir')
    await userEvent.click(canvas.getByRole('button', { name: 'Tambah' }))
    await expect(canvas.getByRole('button', { name: /Tambah/ })).toBeDisabled()
  },
}
