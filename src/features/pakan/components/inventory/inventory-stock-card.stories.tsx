import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'
import { InventoryStockCard } from '#/features/pakan/components/inventory/inventory-stock-card'
import type { InventoryFeedLine } from '#/features/pakan/components/inventory/inventory-stock-card'

const safir: InventoryFeedLine = {
  id: 'safir',
  feedId: 'safir',
  name: 'Safir',
  stockGrams: 700,
  requiredGrams: 900,
  status: 'perlu-tambah',
  figure: 'percent',
}

const meta = {
  title: 'Pakan/InventoryStockCard',
  component: InventoryStockCard,
  tags: ['autodocs'],
  args: {
    lines: [safir],
    emptyLabel: 'Belum ada bibis.',
    renderActions: fn(),
  },
} satisfies Meta<typeof InventoryStockCard>

export default meta
type Story = StoryObj<typeof meta>

export const Short: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('0%')).toBeVisible()
    await expect(canvas.getByText('Perlu tambah bibis')).toBeVisible()
    await expect(canvas.queryByRole('combobox')).not.toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: { lines: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Belum ada bibis.')).toBeVisible()
  },
}
