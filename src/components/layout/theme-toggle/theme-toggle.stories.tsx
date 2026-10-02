import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { usePreferencesStore } from '#/stores/preferences-store'

import { ThemeToggle } from './theme-toggle'

const meta = {
  title: 'Layout/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  beforeEach: () => {
    usePreferencesStore.setState({ theme: 'system', sidebarOpen: true })
  },
} satisfies Meta<typeof ThemeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const System: Story = {}

export const Dark: Story = {
  beforeEach: () => {
    usePreferencesStore.setState({ theme: 'dark', sidebarOpen: true })
  },
}
