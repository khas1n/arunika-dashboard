import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'

import { FastingOverrideForm } from './fasting-override-form'

const meta = {
  title: 'Pakan/FastingOverrideForm',
  component: FastingOverrideForm,
  tags: ['autodocs'],
  args: {
    batchPondId: 'a3',
    onSubmit: fn(async () => {}),
    onCancel: fn(),
  },
} satisfies Meta<typeof FastingOverrideForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const RequiresReason: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Hari pertama'), '2026-10-10')
    await userEvent.type(canvas.getByLabelText('Hari terakhir'), '2026-10-12')
    await userEvent.click(canvas.getByRole('button', { name: 'Simpan' }))
    await expect(canvas.getByText('Alasan wajib diisi')).toBeVisible()
  },
}

export const SubmitsRange: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Hari pertama'), '2026-10-10')
    await userEvent.type(canvas.getByLabelText('Hari terakhir'), '2026-10-12')
    await userEvent.type(canvas.getByLabelText('Alasan'), '  Hujan deras  ')
    await userEvent.click(canvas.getByRole('button', { name: 'Simpan' }))
    await expect(args.onSubmit).toHaveBeenCalledWith({
      batchPondId: 'a3',
      startsOn: '2026-10-10',
      endsOn: '2026-10-12',
      reason: 'Hujan deras',
      note: '',
    })
  },
}
