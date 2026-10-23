import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import { Progress } from '#/components/ui/progress'

const meta = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs'],
  args: { value: 16, 'aria-label': 'Stok' },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Partial: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '16',
    )
  },
}

export const Full: Story = {
  args: { value: 100 },
}
