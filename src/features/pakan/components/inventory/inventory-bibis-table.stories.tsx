import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'
import { InventoryBibisTable } from '#/features/pakan/components/inventory/inventory-bibis-table'

const meta = {
  title: 'Pakan/InventoryBibisTable',
  component: InventoryBibisTable,
  tags: ['autodocs'],
  args: {
    rows: [
      {
        feedId: 'safir',
        feedName: 'Safir',
        feedingOn: '2026-10-24',
        stockGrams: 700,
        consumedGrams: 100,
        requiredGrams: 900,
        preparedGrams: 0,
        remainingGrams: -200,
        shortageGrams: 200,
        stillToPrepareGrams: 900,
        status: 'perlu-tambah',
        missingPondCodes: [],
        ponds: [
          {
            batchPondId: 'a3',
            pondCode: 'A3',
            requiredGrams: 900,
            fasting: false,
            incomplete: false,
          },
        ],
      },
    ],
    onPrepare: fn(),
  },
} satisfies Meta<typeof InventoryBibisTable>

export default meta
type Story = StoryObj<typeof meta>

export const Shortage: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Perlu tambah bibis')).toBeVisible()
    await expect(canvas.getByText('0%')).toBeVisible()
    await expect(canvas.queryByText('700')).not.toBeInTheDocument()
    await expect(
      canvas.queryByRole('link', { name: 'A3' }),
    ).not.toBeInTheDocument()
    await expect(canvas.queryByText('Hari pemberian')).not.toBeInTheDocument()
  },
}

export const Incomplete: Story = {
  args: {
    rows: [
      {
        feedId: 'pellet',
        feedName: '781',
        feedingOn: '2026-10-24',
        stockGrams: 1000,
        consumedGrams: 0,
        requiredGrams: 150,
        preparedGrams: 0,
        remainingGrams: 850,
        shortageGrams: 0,
        stillToPrepareGrams: 150,
        status: 'aman',
        missingPondCodes: ['A6'],
        ponds: [
          {
            batchPondId: 'a6',
            pondCode: 'A6',
            requiredGrams: null,
            fasting: false,
            incomplete: true,
          },
        ],
      },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Aman')).toBeVisible()
    await expect(canvas.queryByText('Data belum lengkap')).not.toBeInTheDocument()
  },
}
