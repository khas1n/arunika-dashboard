import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Field, FieldError, FieldLabel } from './field'
import { Input } from './input'

const meta = {
  title: 'UI/Field',
  component: Field,
  tags: ['autodocs'],
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const WithError: Story = {
  render: () => (
    <Field data-invalid>
      <FieldLabel htmlFor="story-email">Email</FieldLabel>
      <Input id="story-email" aria-invalid defaultValue="bukan-email" />
      <FieldError errors={[{ message: 'Masukkan email yang valid.' }]} />
    </Field>
  ),
}
