import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Spinner } from './spinner'

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  args: { 'aria-label': 'Memuat' },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
