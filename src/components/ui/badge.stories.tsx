import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Badge, StatusBadge } from './badge'
import { Button } from './button'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { children: 'Dipakai', size: 'xs' },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Secondary: Story = { args: { variant: 'secondary' } }

export const Destructive: Story = { args: { variant: 'destructive' } }

export const Outline: Story = { args: { variant: 'outline' } }

export const Statuses: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" size="xs">
          secondary
        </Badge>
        <Button size="xs" variant="secondary">
          secondary
        </Button>
      </div>
      {(
        ['accent', 'success', 'info', 'warning', 'neutral', 'destructive'] as const
      ).map((variant) => (
        <div key={variant} className="flex items-center gap-2">
          <StatusBadge variant={variant}>{variant}</StatusBadge>
          <Button size="xs" variant={variant}>
            {variant}
          </Button>
        </div>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(['xs', 'sm', 'default', 'lg'] as const).map((size) => (
        <div key={size} className="flex items-center gap-2">
          <Badge size={size}>Primary</Badge>
          <Button size={size}>Primary</Button>
          <Badge variant="destructive" size={size}>
            Destructive
          </Badge>
          <Button variant="destructive" size={size}>
            Destructive
          </Button>
        </div>
      ))}
    </div>
  ),
}
