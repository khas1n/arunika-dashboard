import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import { InventoryStockMeter } from '#/features/pakan/components/inventory/inventory-stock-meter'

const meta = {
  title: 'Pakan/InventoryStockMeter',
  component: InventoryStockMeter,
  tags: ['autodocs'],
  args: { requiredGrams: 12_000, stockGrams: 75_000 },
} satisfies Meta<typeof InventoryStockMeter>

export default meta
type Story = StoryObj<typeof meta>

export const Covered: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('84%')).toBeVisible()
  },
}

export const Short: Story = {
  args: { requiredGrams: 900, stockGrams: 700 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('0%')).toBeVisible()
  },
}

export const Incomplete: Story = {
  args: { requiredGrams: null, stockGrams: 1000 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('—')).toBeVisible()
  },
}
