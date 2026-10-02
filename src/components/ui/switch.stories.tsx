import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Switch } from './switch'

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  args: { 'aria-label': 'Sidebar terbuka' },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = {}

export const On: Story = { args: { checked: true } }
