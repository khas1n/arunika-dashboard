import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'
import { InventoryStockTable } from '#/features/pakan/components/inventory/inventory-stock-table'

const meta = {
  title: 'Pakan/InventoryStockTable',
  component: InventoryStockTable,
  tags: ['autodocs'],
  args: {
    rows: [
      {
        feedId: 'pellet',
        feedName: '781',
        receivedGrams: 1000,
        consumedGrams: 100,
        adjustmentGrams: 0,
        stockGrams: 900,
        lastReceipt: null,
      },
    ],
    onReceive: fn(),
    onCount: fn(),
  },
} satisfies Meta<typeof InventoryStockTable>

export default meta
type Story = StoryObj<typeof meta>

export const WithActualConsumption: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('900')).toBeVisible()
    await userEvent.click(canvas.getAllByRole('button', { name: 'Tambah' })[0])
    await expect(args.onReceive).toHaveBeenCalled()
  },
}

export const Empty: Story = {
  args: { rows: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Belum ada jenis pakan.')).toBeVisible()
  },
}
