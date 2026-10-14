import type { FC } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import { CheckboxField } from '#/components/shared/form/checkbox-field'
import { useAppForm } from '#/components/shared/form/use-app-form'

const Preview: FC = () => {
  const form = useAppForm({
    defaultValues: { rememberMe: false },
  })

  return (
    <form className="grid max-w-xs gap-3">
      <form.AppField name="rememberMe">
        {(field) => <field.CheckboxField label="Ingat saya" />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.rememberMe}>
        {(rememberMe) => (
          <output aria-label="Nilai">{rememberMe ? 'ya' : 'tidak'}</output>
        )}
      </form.Subscribe>
    </form>
  )
}

const meta = {
  title: 'Shared/Form/CheckboxField',
  component: CheckboxField,
  tags: ['autodocs'],
  args: { label: 'Ingat saya' },
  render: () => <Preview />,
} satisfies Meta<typeof CheckboxField>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByLabelText('Nilai')).toHaveTextContent('tidak')
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Ingat saya' }))
    await expect(canvas.getByLabelText('Nilai')).toHaveTextContent('ya')
  },
}
