import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group'

const meta = {
  title: 'UI/InputGroup',
  component: InputGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput aria-label="Kata sandi" type="password" />
      <InputGroupAddon align="inline-end">Lihat</InputGroupAddon>
    </InputGroup>
  ),
}
