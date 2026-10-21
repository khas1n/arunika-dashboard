import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'
import { TreatmentLogForm } from '#/features/pakan/components/pond-log/treatment-log/treatment-log-form'

const options = [
  { id: 'molase', code: 'MOLASE', name: 'Molase' },
  { id: 'gos', code: 'GOS_STRONG', name: 'Gos Strong' },
]

const meta = {
  title: 'Pakan/PondLog/TreatmentLogForm',
  component: TreatmentLogForm,
  tags: ['autodocs'],
  args: {
    batchPondId: 'a3',
    options,
    onSubmit: fn(async () => {}),
    onCancel: fn(),
  },
} satisfies Meta<typeof TreatmentLogForm>

export default meta
type Story = StoryObj<typeof meta>

export const Create: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('combobox', { name: 'Treatment' }),
    ).toBeVisible()
    await expect(canvas.getByLabelText('Jumlah')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Tanggal' })).toBeVisible()
    await expect(canvas.getByLabelText('Waktu')).toBeVisible()
  },
}

export const Edit: Story = {
  args: {
    initial: {
      id: '1',
      treatmentId: 'molase',
      treatmentCode: 'MOLASE',
      treatmentName: 'Molase',
      quantityGrams: 250,
      occurredAt: '2026-10-20T05:00:00.000Z',
      userName: 'Admin',
    },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('combobox', { name: 'Treatment' }),
    ).toHaveTextContent('Molase')
    const time = canvas.getByLabelText('Waktu')
    await expect(time).not.toHaveValue('')
  },
}
