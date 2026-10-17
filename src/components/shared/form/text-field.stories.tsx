import type { FC } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import { useAppForm } from '#/components/shared/form/use-app-form'
import { TextField } from '#/components/shared/form/text-field'

const Preview: FC = () => {
  const form = useAppForm({
    defaultValues: { name: 'Nila' },
  })

  return (
    <form className="grid max-w-xs gap-3">
      <form.AppField name="name">
        {(field) => <field.TextField label="Nama" />}
      </form.AppField>
    </form>
  )
}

const meta = {
  title: 'Shared/Form/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: { label: 'Nama' },
  render: () => <Preview />,
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Nama')).toHaveValue('Nila')
  },
}
