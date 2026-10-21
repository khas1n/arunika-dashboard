import type { FC } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import { SelectField } from '#/components/shared/form/select-field'
import { useAppForm } from '#/components/shared/form/use-app-form'

const options = [
  { value: 'molase', label: 'Molase' },
  { value: 'gos', label: 'Gos Strong' },
  { value: 'aqua', label: 'Aqua Cell' },
]

const Preview: FC<{ initial?: string }> = ({ initial = '' }) => {
  const form = useAppForm({
    defaultValues: { treatmentId: initial },
  })
  return (
    <form className="grid max-w-xs gap-3">
      <form.AppField name="treatmentId">
        {(field) => (
          <field.SelectField
            label="Treatment"
            placeholder="Pilih treatment"
            options={options}
          />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.treatmentId}>
        {(value) => <output aria-label="Nilai">{value || 'kosong'}</output>}
      </form.Subscribe>
    </form>
  )
}

const meta = {
  title: 'Shared/Form/SelectField',
  component: SelectField,
  tags: ['autodocs'],
  args: {
    label: 'Treatment',
    options,
  },
  render: () => <Preview />,
} satisfies Meta<typeof SelectField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Nilai')).toHaveTextContent('kosong')
  },
}

export const Choose: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Treatment' }))
    await userEvent.click(
      await canvas.findByRole('option', { name: 'Molase' }),
    )
    await expect(canvas.getByLabelText('Nilai')).toHaveTextContent('molase')
  },
}
