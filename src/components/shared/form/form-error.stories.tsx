import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen } from 'storybook/test'
import { FormError } from '#/components/shared/form/form-error'

const meta = {
  title: 'Shared/Form/FormError',
  component: FormError,
  tags: ['autodocs'],
} satisfies Meta<typeof FormError>

export default meta
type Story = StoryObj<typeof meta>

export const Hidden: Story = {}

export const Message: Story = {
  args: { message: 'Nama pengguna atau kata sandi salah.' },
  play: async () => {
    await expect(
      screen.getByText('Nama pengguna atau kata sandi salah.'),
    ).toBeVisible()
  },
}
