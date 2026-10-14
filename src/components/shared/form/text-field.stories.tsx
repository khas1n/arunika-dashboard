import type { FC } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import { useAppForm } from '#/components/shared/form/use-app-form'
import { TextField } from '#/components/shared/form/text-field'

const Preview: FC = () => {
  const form = useAppForm({
    defaultValues: { date: '2026-10-14' },
  })

  return (
    <form className="grid max-w-xs gap-3">
      <form.AppField name="date">
        {(field) => <field.TextField label="Tanggal" type="date" />}
      </form.AppField>
    </form>
  )
}

const meta = {
  title: 'Shared/Form/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: { label: 'Tanggal' },
  render: () => <Preview />,
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

export const Date: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Tanggal')).toHaveValue('2026-10-14')
  },
}
