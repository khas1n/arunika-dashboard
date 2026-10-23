import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { InventoryStatus } from '#/features/pakan/components/inventory/inventory-status'

const meta = {
  title: 'Pakan/InventoryStatus',
  component: InventoryStatus,
  tags: ['autodocs'],
  args: { status: 'aman' },
} satisfies Meta<typeof InventoryStatus>

export default meta
type Story = StoryObj<typeof meta>

export const Aman: Story = {}

export const PerluTambah: Story = {
  args: { status: 'perlu-tambah' },
}

export const DataBelumLengkap: Story = {
  args: { status: 'data-belum-lengkap' },
}
