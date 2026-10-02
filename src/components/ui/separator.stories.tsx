import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Separator } from './separator'

const meta = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div className="w-48">
      <Separator />
    </div>
  ),
}
