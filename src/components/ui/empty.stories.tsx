import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from './empty'

function EmptyDemo() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Belum ada data</EmptyTitle>
        <EmptyDescription>Tambah data untuk mulai.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

const meta = {
  title: 'UI/Empty',
  component: EmptyDemo,
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
