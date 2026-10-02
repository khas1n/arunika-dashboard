import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { usePreferencesStore } from '#/stores/preferences-store'

import { PreferencesForm } from './preferences-form'

const meta = {
  title: 'Settings/PreferencesForm',
  component: PreferencesForm,
  tags: ['autodocs'],
  beforeEach: () => {
    usePreferencesStore.setState({ theme: 'system', sidebarOpen: true })
  },
} satisfies Meta<typeof PreferencesForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const DarkCollapsed: Story = {
  beforeEach: () => {
    usePreferencesStore.setState({ theme: 'dark', sidebarOpen: false })
  },
}
