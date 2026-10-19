import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn, screen, waitFor } from 'storybook/test'
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

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Berat (g)')).toBeDisabled()
    await expect(canvas.getByLabelText('Kematian')).toBeDisabled()
    await expect(canvas.getByLabelText('Pakan aktual (g)')).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Simpan' })).toBeDisabled()
  },
}

export const LoadsExistingDay: Story = {
  args: {
    loadDay: fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return {
        averageWeightGrams: 25,
        deaths: 8,
        actualFeedGrams: 500,
      }
    }),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Tanggal' }))
    await userEvent.click(
      await screen.findByRole('button', { name: /, 2 Oktober 2026/ }),
    )
    await expect(await screen.findByText('Memuat catatan.')).toBeVisible()
    await expect(canvas.getByLabelText('Berat (g)')).toBeDisabled()
    await waitFor(() => {
      expect(canvas.getByLabelText('Berat (g)')).toHaveValue('25')
    })
    await expect(canvas.getByLabelText('Kematian')).toHaveValue('8')
    await expect(canvas.getByLabelText('Pakan aktual (g)')).toHaveValue('500')
    await expect(canvas.getByLabelText('Berat (g)')).toBeEnabled()
    await expect(args.loadDay).toHaveBeenCalledWith('2026-10-02')
  },
}

export const SavesInputs: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Tanggal' }))
    await userEvent.click(
      await screen.findByRole('button', { name: /14 Oktober 2026/ }),
    )
    await userEvent.type(canvas.getByLabelText('Berat (g)'), '30')
    await userEvent.clear(canvas.getByLabelText('Kematian'))
    await userEvent.type(canvas.getByLabelText('Kematian'), '3')
    await userEvent.clear(canvas.getByLabelText('Pakan aktual (g)'))
    await userEvent.type(canvas.getByLabelText('Pakan aktual (g)'), '412')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    await expect(args.onSubmit).toHaveBeenCalledWith({
      date: '2026-10-14',
      averageWeightGrams: 30,
      deaths: 3,
      actualFeedGrams: 412,
    })
  },
}
