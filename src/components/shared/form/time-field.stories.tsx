import type { FC } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import { TimeField } from '#/components/shared/form/time-field'
import { useAppForm } from '#/components/shared/form/use-app-form'

const Preview: FC<{ initial?: string }> = ({ initial = '' }) => {
  const form = useAppForm({
    defaultValues: { time: initial },
  })
  return (
    <form className="grid max-w-xs gap-3">
      <form.AppField name="time">
        {(field) => <field.TimeField label="Waktu" />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.time}>
        {(time) => <output aria-label="Nilai">{time || 'kosong'}</output>}
      </form.Subscribe>
    </form>
  )
}

const meta = {
  title: 'Shared/Form/TimeField',
  component: TimeField,
  tags: ['autodocs'],
  args: { label: 'Waktu' },
  render: () => <Preview />,
} satisfies Meta<typeof TimeField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Nilai')).toHaveTextContent('kosong')
  },
}

export const WithValue: Story = {
  render: () => <Preview initial="14:30" />,
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Nilai')).toHaveTextContent('14:30')
    await expect(canvas.getByLabelText('Waktu')).toHaveValue('14:30')
  },
}

export const TypeTwentyFourHour: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Waktu')
    await userEvent.type(input, '1430')
    await expect(input).toHaveValue('14:30')
    await expect(canvas.getByLabelText('Nilai')).toHaveTextContent('14:30')
  },
}
