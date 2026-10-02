import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Skeleton } from './skeleton'

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  args: { className: 'h-8 w-40' },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
