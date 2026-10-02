import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Label } from './label'

const meta = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
  args: { children: 'Email' },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
