import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { DashboardPending } from './dashboard-pending'

const meta = {
  title: 'Dashboard/DashboardPending',
  component: DashboardPending,
  tags: ['autodocs'],
} satisfies Meta<typeof DashboardPending>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
