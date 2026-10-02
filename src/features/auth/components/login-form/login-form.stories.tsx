import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'

import { LoginForm } from './login-form'

const meta = {
  title: 'Auth/LoginForm',
  component: LoginForm,
  tags: ['autodocs'],
  args: {
    onSubmit: fn(async () => {}),
  },
} satisfies Meta<typeof LoginForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ValidationErrors: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Masuk' }))
    await expect(
      canvas.getByText('Nama pengguna minimal 3 karakter'),
    ).toBeVisible()
    await expect(
      canvas.getByText('Kata sandi minimal 8 karakter'),
    ).toBeVisible()
  },
}

export const InvalidCredentials: Story = {
  args: {
    onSubmit: fn(async () => {
      throw new Error('Nama pengguna atau kata sandi salah.')
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Nama pengguna'), 'admin')
    await userEvent.type(canvas.getByLabelText('Kata sandi'), 'salahsalah')
    await userEvent.click(canvas.getByRole('button', { name: 'Masuk' }))
    await expect(
      canvas.getByText('Nama pengguna atau kata sandi salah.'),
    ).toBeVisible()
  },
}

export const Submitting: Story = {
  args: {
    onSubmit: fn(() => new Promise(() => {})),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Nama pengguna'), 'admin')
    await userEvent.type(canvas.getByLabelText('Kata sandi'), 'password1')
    await userEvent.click(canvas.getByRole('button', { name: 'Masuk' }))
    await expect(
      canvas.getByRole('button', { name: /Memproses/ }),
    ).toBeDisabled()
  },
}
