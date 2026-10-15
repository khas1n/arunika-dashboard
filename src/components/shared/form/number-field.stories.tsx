import type { FC } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen } from 'storybook/test'
import { useAppForm } from '#/components/shared/form/use-app-form'
import { NumberField } from '#/components/shared/form/number-field'

interface PreviewProps {
  label: string
  fractionDigits?: number
  scale?: number
  emptyValue?: number | null
  max?: number
  suffix?: string
  initial?: number | null
}

const Preview: FC<PreviewProps> = ({
  label,
  fractionDigits,
  scale,
  emptyValue,
  max,
  suffix,
  initial = null,
}) => {
  const form = useAppForm({
    defaultValues: { amount: initial },
  })

  return (
    <form
      className="grid max-w-xs gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppField name="amount">
        {(field) => (
          <field.NumberField
            label={label}
            fractionDigits={fractionDigits}
            scale={scale}
            emptyValue={emptyValue}
            max={max}
            suffix={suffix}
          />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.amount}>
        {(amount) => (
          <output aria-label="Nilai">
            {amount == null ? 'kosong' : amount}
          </output>
        )}
      </form.Subscribe>
    </form>
  )
}

const meta = {
  title: 'Shared/Form/NumberField',
  component: NumberField,
  tags: ['autodocs'],
  args: { label: 'Jumlah' },
  render: (args) => <Preview label={args.label ?? 'Jumlah'} />,
} satisfies Meta<typeof NumberField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Grouped: Story = {
  args: { label: 'Pakan aktual (g)' },
  render: (args) => (
    <Preview
      label={args.label ?? 'Pakan aktual (g)'}
      fractionDigits={1}
      initial={4120}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Pakan aktual (g)')
    await userEvent.clear(input)
    await userEvent.type(input, '1234,5')
    await expect(screen.getByLabelText('Nilai')).toHaveTextContent('1234.5')
  },
}

export const Percent: Story = {
  args: { label: 'FR min (%)' },
  render: () => (
    <Preview
      label="FR min (%)"
      fractionDigits={2}
      scale={100}
      max={100}
      suffix="%"
      initial={0.04}
    />
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('FR min (%)')).toHaveValue('4')
    await expect(canvas.getByText('%')).toBeVisible()
  },
}
