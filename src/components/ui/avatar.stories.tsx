import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Avatar, AvatarFallback } from './avatar'

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>A</AvatarFallback>
    </Avatar>
  ),
}
