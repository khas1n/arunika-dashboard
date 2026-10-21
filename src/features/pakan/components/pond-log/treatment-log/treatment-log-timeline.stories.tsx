import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'
import { TreatmentLogTimeline } from '#/features/pakan/components/pond-log/treatment-log/treatment-log-timeline'
import type { TreatmentLogItem } from '#/features/pakan/schemas/kolam'

const rows = [
  {
    id: '1',
    treatmentId: 'aqua',
    treatmentCode: 'AQUA_CELL',
    treatmentName: 'Aqua Cell',
    quantityGrams: 200,
    occurredAt: '2026-10-20T08:55:00.000Z',
    userName: 'Administrator',
  },
  {
    id: '2',
    treatmentId: 'basilus',
    treatmentCode: 'BASILUS',
    treatmentName: 'Basilus',
    quantityGrams: 1000,
    occurredAt: '2026-10-20T08:54:00.000Z',
    userName: 'Administrator',
  },
  {
    id: '3',
    treatmentId: 'molase',
    treatmentCode: 'MOLASE',
    treatmentName: 'Molase',
    quantityGrams: 2000,
    occurredAt: '2026-09-29T17:00:00.000Z',
    userName: 'Administrator',
  },
] satisfies Array<TreatmentLogItem>

const meta = {
  title: 'Pakan/PondLog/TreatmentLogTimeline',
  component: TreatmentLogTimeline,
  tags: ['autodocs'],
  args: {
    rows,
    onEdit: fn(),
    onRevoke: fn(),
  },
} satisfies Meta<typeof TreatmentLogTimeline>

export default meta
type Story = StoryObj<typeof meta>

export const WithRows: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Aqua Cell')).toBeVisible()
    await expect(canvas.getByText('Basilus')).toBeVisible()
    await expect(canvas.getByText('Molase')).toBeVisible()
    await expect(canvas.getAllByText('Administrator').length).toBe(3)
    await expect(canvas.getAllByText('menambahkan').length).toBe(3)
  },
}

export const Empty: Story = {
  args: { rows: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Belum ada treatment')).toBeVisible()
  },
}
