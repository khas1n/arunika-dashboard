import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Input } from './input'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  args: { placeholder: 'Nama', 'aria-label': 'Nama' },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: 'x' },
}
