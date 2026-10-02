import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { fn } from 'storybook/test'

import { usePreferencesStore } from '#/stores/preferences-store'

import { AppShell } from './app-shell'

const meta = {
  title: 'Layout/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    user: {
      name: 'Administrator',
      email: 'admin@arunika.local',
      image: null,
    },
    onSignOut: fn(),
    children: <p>Selamat datang</p>,
  },
  beforeEach: () => {
    usePreferencesStore.setState({ theme: 'system', sidebarOpen: true })
  },
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
