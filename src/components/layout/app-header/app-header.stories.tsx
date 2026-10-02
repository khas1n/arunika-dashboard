import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { fn } from 'storybook/test'

import { SidebarProvider } from '#/components/ui/sidebar'

import { AppHeader } from './app-header'

const meta = {
  title: 'Layout/AppHeader',
  component: AppHeader,
  tags: ['autodocs'],
  args: {
    user: {
      name: 'Administrator',
      email: 'admin@arunika.local',
      image: null,
    },
    onSignOut: fn(),
  },
  decorators: [
    (Story) => (
      <SidebarProvider>
        <Story />
      </SidebarProvider>
    ),
  ],
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
