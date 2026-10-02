import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Card, CardDescription, CardHeader, CardTitle } from './card'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-64">
      <CardHeader>
        <CardDescription>Total pengguna</CardDescription>
        <CardTitle className="text-3xl">1</CardTitle>
      </CardHeader>
    </Card>
  ),
}
