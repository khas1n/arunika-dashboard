import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Textarea } from './textarea'

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  args: { placeholder: 'Catatan', 'aria-label': 'Catatan' },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
