import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { fn } from 'storybook/test'

import { UserMenu } from './user-menu'

const meta = {
  title: 'Layout/UserMenu',
  component: UserMenu,
  tags: ['autodocs'],
  args: {
    name: 'Administrator',
    email: 'admin@arunika.local',
    image: null,
    onSignOut: fn(),
  },
} satisfies Meta<typeof UserMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
