import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'
import { InventoryMovementForm } from '#/features/pakan/components/inventory/inventory-movement-form'

const feeds = [
  { id: 'pellet', name: '781' },
  { id: 'safir', name: 'Safir' },
]

const meta = {
  title: 'Pakan/InventoryMovementForm',
  component: InventoryMovementForm,
  tags: ['autodocs'],
  args: {
    kind: 'receipt',
    feeds,
    onSubmitReceipt: fn(async () => {}),
    onSubmitBibis: fn(async () => {}),
    onSubmitOpname: fn(async () => {}),
    onCancel: fn(),
  },
} satisfies Meta<typeof InventoryMovementForm>

export default meta
type Story = StoryObj<typeof meta>

export const Receipt: Story = {}

export const Bibis: Story = {
  args: { kind: 'bibis', defaultFeedingOn: '2026-10-24' },
}

export const OpnameRequiresReason: Story = {
  args: { kind: 'opname' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Jumlah fisik'), '10')
    await userEvent.click(canvas.getByRole('button', { name: 'Catat opname' }))
    await expect(canvas.getByText('Alasan koreksi wajib diisi')).toBeVisible()
  },
}
