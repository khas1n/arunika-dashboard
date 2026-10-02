import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { SummaryCards } from './summary-cards'

const meta = {
  title: 'Dashboard/SummaryCards',
  component: SummaryCards,
  tags: ['autodocs'],
  args: { userCount: 1, sessionCount: 2 },
} satisfies Meta<typeof SummaryCards>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = { args: { userCount: 0, sessionCount: 0 } }
