import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Button } from './button'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Simpan' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Outline: Story = { args: { variant: 'outline' } }

export const Destructive: Story = { args: { variant: 'destructive' } }

export const Success: Story = { args: { variant: 'success' } }

export const Info: Story = { args: { variant: 'info' } }

export const Warning: Story = { args: { variant: 'warning' } }

export const Neutral: Story = { args: { variant: 'neutral' } }

export const Accent: Story = { args: { variant: 'accent' } }

export const Disabled: Story = { args: { disabled: true } }

export const Loading: Story = {
  args: { loading: true, children: 'Memproses...' },
}
