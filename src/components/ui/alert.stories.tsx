import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Alert, AlertDescription, AlertTitle } from './alert'

const meta = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Informasi</AlertTitle>
      <AlertDescription>Perubahan tersimpan.</AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertDescription>Nama pengguna atau kata sandi salah.</AlertDescription>
    </Alert>
  ),
}
