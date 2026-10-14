import type { FC } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import { TextareaField } from '#/components/shared/form/textarea-field'
import { useAppForm } from '#/components/shared/form/use-app-form'

const Preview: FC = () => {
  const form = useAppForm({
    defaultValues: { note: 'Air keruh' },
  })

  return (
    <form className="grid max-w-xs gap-3">
      <form.AppField name="note">
        {(field) => <field.TextareaField label="Catatan" />}
      </form.AppField>
    </form>
  )
}

const meta = {
  title: 'Shared/Form/TextareaField',
  component: TextareaField,
  tags: ['autodocs'],
  args: { label: 'Catatan' },
  render: () => <Preview />,
} satisfies Meta<typeof TextareaField>

export default meta
type Story = StoryObj<typeof meta>

export const Filled: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Catatan')).toHaveValue('Air keruh')
  },
}
