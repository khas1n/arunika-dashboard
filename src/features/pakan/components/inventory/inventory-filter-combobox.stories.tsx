import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'
import { InventoryFilterCombobox } from '#/features/pakan/components/inventory/inventory-filter-combobox'

const meta = {
  title: 'Pakan/InventoryFilterCombobox',
  component: InventoryFilterCombobox,
  tags: ['autodocs'],
  args: {
    label: 'Jenis pakan',
    value: null,
    allLabel: 'Semua jenis',
    options: [
      { value: 'pellet', label: '781' },
      { value: 'safir', label: 'Safir' },
    ],
    onChange: fn(),
  },
} satisfies Meta<typeof InventoryFilterCombobox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Jenis pakan' }))
    await userEvent.click(await canvas.findByRole('option', { name: 'Safir' }))
    await expect(args.onChange).toHaveBeenCalledWith('safir')
  },
}
