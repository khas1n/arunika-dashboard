import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn, screen } from 'storybook/test'

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

async function pickDay(
  user: { click: (element: HTMLElement) => Promise<void> },
  label: string,
  day: RegExp,
) {
  await user.click(screen.getByRole('button', { name: label }))
  await user.click(await screen.findByRole('button', { name: day }))
}

export const RequiresReason: Story = {
  play: async ({ canvas, userEvent }) => {
    await pickDay(userEvent, 'Hari pertama', /10 Oktober 2026/)
    await pickDay(userEvent, 'Hari terakhir', /12 Oktober 2026/)
    await userEvent.click(canvas.getByRole('button', { name: 'Simpan' }))
    await expect(canvas.getByText('Alasan wajib diisi')).toBeVisible()
  },
}

export const SubmitsRange: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await pickDay(userEvent, 'Hari pertama', /10 Oktober 2026/)
    await pickDay(userEvent, 'Hari terakhir', /12 Oktober 2026/)
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
