import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn, screen } from 'storybook/test'
import { PondDayForm } from '#/features/pakan/components/pond-day-form/pond-day-form'

const meta = {
  title: 'Pakan/PondDayForm',
  component: PondDayForm,
  tags: ['autodocs'],
  args: {
    onSubmit: fn(async () => {}),
    onCancel: fn(),
  },
} satisfies Meta<typeof PondDayForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SavesInputs: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Tanggal'), '2026-10-14')
    await userEvent.type(canvas.getByLabelText('Berat (g)'), '30')
    await userEvent.type(canvas.getByLabelText('FR min (%)'), '4')
    await userEvent.type(canvas.getByLabelText('FR max (%)'), '5')
    await userEvent.clear(canvas.getByLabelText('Kematian'))
    await userEvent.type(canvas.getByLabelText('Kematian'), '3')
    await userEvent.clear(canvas.getByLabelText('Pakan aktual (g)'))
    await userEvent.type(canvas.getByLabelText('Pakan aktual (g)'), '412')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    await expect(args.onSubmit).toHaveBeenCalledWith({
      date: '2026-10-14',
      averageWeightGrams: 30,
      frMin: 0.04,
      frMax: 0.05,
      deaths: 3,
      actualFeedGrams: 412,
    })
  },
}
