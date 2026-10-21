import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'
import { TreatmentLogPanel } from '#/features/pakan/components/pond-log/treatment-log/treatment-log-panel'
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
    quantityGrams: 10000,
    occurredAt: '2026-09-29T11:33:00.000Z',
    userName: 'Administrator',
  },
  {
    id: '4',
    treatmentId: 'gos',
    treatmentCode: 'GOS_STRONG',
    treatmentName: 'Gos Strong',
    quantityGrams: 222222,
    occurredAt: '2026-09-29T09:38:00.000Z',
    userName: 'Administrator',
  },
] satisfies Array<TreatmentLogItem>

const meta = {
  title: 'Pakan/PondLog/TreatmentLogPanel',
  component: TreatmentLogPanel,
  tags: ['autodocs'],
  args: {
    plannedTreatments: [
      { id: 'basilus', code: 'BASILUS', name: 'Basilus' },
      { id: 'molase', code: 'MOLASE', name: 'Molase' },
    ],
    rows,
    range: null,
    onRangeChange: fn(),
    onFetchNextPage: fn(),
    onCreate: fn(),
    onEdit: fn(),
    onRevoke: fn(),
  },
} satisfies Meta<typeof TreatmentLogPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: 'Treatment' }),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Catat' })).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: /Semua tanggal|Pilih rentang/ }),
    ).toBeVisible()
    await expect(canvas.getByText('Aqua Cell')).toBeVisible()
  },
}

export const Empty: Story = {
  args: { rows: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Belum ada treatment')).toBeVisible()
  },
}

export const Loading: Story = {
  args: {
    rows: [],
    isPending: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Memuat treatment')).toBeVisible()
  },
}

export const LoadingMore: Story = {
  args: {
    isFetchingNextPage: true,
    hasNextPage: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toBeVisible()
  },
}
