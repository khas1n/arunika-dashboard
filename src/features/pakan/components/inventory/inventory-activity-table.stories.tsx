import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'
import { InventoryActivityTable } from '#/features/pakan/components/inventory/inventory-activity-table'

const meta = {
  title: 'Pakan/InventoryActivityTable',
  component: InventoryActivityTable,
  tags: ['autodocs'],
  args: {
    rows: [
      {
        id: 'application:1',
        sourceId: '1',
        type: 'application',
        occurredAt: new Date('2026-10-21T01:00:00.000Z'),
        feedId: 'pellet',
        feedName: '781',
        quantityGrams: 100,
        pondCode: 'A6',
        userName: 'Admin',
        note: null,
      },
    ],
    rowCount: 1,
    type: 'all',
    onTypeChange: fn(),
  },
} satisfies Meta<typeof InventoryActivityTable>

export default meta
type Story = StoryObj<typeof meta>

export const ActualFeed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Pakan aktual')).toBeVisible()
    await expect(canvas.getByText('−100')).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'A6' })).toBeVisible()
  },
}

export const Empty: Story = {
  args: { rows: [], rowCount: 0 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Belum ada pergerakan stok.')).toBeVisible()
  },
}
