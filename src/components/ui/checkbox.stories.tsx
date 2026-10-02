import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Checkbox } from './checkbox'

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: { 'aria-label': 'Ingat saya' },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {}

export const Checked: Story = { args: { checked: true } }
