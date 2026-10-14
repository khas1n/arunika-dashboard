import type { FC } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import { PasswordField } from '#/components/shared/form/password-field'
import { useAppForm } from '#/components/shared/form/use-app-form'

const Preview: FC = () => {
  const form = useAppForm({
    defaultValues: { password: '' },
  })

  return (
    <form className="grid max-w-xs gap-3">
      <form.AppField name="password">
        {(field) => <field.PasswordField label="Kata sandi" />}
      </form.AppField>
    </form>
  )
}

const meta = {
  title: 'Shared/Form/PasswordField',
  component: PasswordField,
  tags: ['autodocs'],
  args: { label: 'Kata sandi' },
  render: () => <Preview />,
} satisfies Meta<typeof PasswordField>

export default meta
type Story = StoryObj<typeof meta>

export const Hidden: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Kata sandi')
    await expect(input).toHaveAttribute('type', 'password')
    await userEvent.click(
      canvas.getByRole('button', { name: 'Tampilkan kata sandi' }),
    )
    await expect(input).toHaveAttribute('type', 'text')
  },
}
