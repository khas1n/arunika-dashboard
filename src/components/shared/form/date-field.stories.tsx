import type { FC } from 'react'
import type { DateRange } from '@daypicker/react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen, waitFor } from 'storybook/test'
import { format } from 'date-fns'
import { DateField } from '#/components/shared/form/date-field'
import { useAppForm } from '#/components/shared/form/use-app-form'

function stamp(value: Date | null | Date[] | DateRange) {
  if (value == null) return 'kosong'
  if (value instanceof Date) return format(value, 'yyyy-MM-dd')
  if (Array.isArray(value)) {
    return value.map((date) => format(date, 'yyyy-MM-dd')).join(', ')
  }
  if (value.from == null) return 'kosong'
  const from = format(value.from, 'yyyy-MM-dd')
  return value.to == null ? from : `${from} – ${format(value.to, 'yyyy-MM-dd')}`
}

const SinglePreview: FC = () => {
  const form = useAppForm({
    defaultValues: { date: null as Date | null },
  })
  return (
    <form className="grid max-w-xs gap-3">
      <form.AppField name="date">
        {(field) => <field.DateField label="Tanggal" />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.date}>
        {(date) => <output aria-label="Nilai">{stamp(date)}</output>}
      </form.Subscribe>
    </form>
  )
}

const MultiplePreview: FC = () => {
  const form = useAppForm({
    defaultValues: { dates: [] as Date[] },
  })
  return (
    <form className="grid max-w-xs gap-3">
      <form.AppField name="dates">
        {(field) => <field.DateField label="Tanggal" mode="multiple" />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.dates}>
        {(dates) => <output aria-label="Nilai">{stamp(dates)}</output>}
      </form.Subscribe>
    </form>
  )
}

const RangePreview: FC = () => {
  const form = useAppForm({
    defaultValues: { range: null as DateRange | null },
  })
  return (
    <form className="grid max-w-xs gap-3">
      <form.AppField name="range">
        {(field) => <field.DateField label="Rentang" mode="range" />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.range}>
        {(range) => <output aria-label="Nilai">{stamp(range)}</output>}
      </form.Subscribe>
    </form>
  )
}

const DisabledPreview: FC = () => {
  const form = useAppForm({
    defaultValues: { date: null as Date | null },
  })
  return (
    <form className="grid max-w-xs gap-3">
      <form.AppField name="date">
        {(field) => (
          <field.DateField
            label="Tanggal"
            disabledDates={[{ dayOfWeek: [0, 6] }, new Date(2026, 9, 15)]}
          />
        )}
      </form.AppField>
    </form>
  )
}

const meta = {
  title: 'Shared/Form/DateField',
  component: DateField,
  tags: ['autodocs'],
  args: { label: 'Tanggal' },
  render: () => <SinglePreview />,
} satisfies Meta<typeof DateField>

export default meta
type Story = StoryObj<typeof meta>

async function pickDay(
  user: { click: (element: HTMLElement) => Promise<void> },
  name: RegExp,
) {
  await user.click(await screen.findByRole('button', { name }))
}

const CalendarDayPreview: FC = () => {
  const form = useAppForm({
    defaultValues: { date: '' },
  })
  return (
    <form className="grid max-w-xs gap-3">
      <form.AppField name="date">
        {(field) => <field.DateField label="Tanggal" />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.date}>
        {(date) => <output aria-label="Nilai">{date || 'kosong'}</output>}
      </form.Subscribe>
    </form>
  )
}

export const CalendarDay: Story = {
  render: () => <CalendarDayPreview />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Tanggal' }))
    await pickDay(userEvent, /20 Oktober 2026/)
    await expect(
      canvas.getByRole('button', { name: 'Tanggal' }),
    ).toHaveTextContent('20 Okt 2026')
    await expect(canvas.getByLabelText('Nilai')).toHaveTextContent('2026-10-20')
  },
}

export const Single: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Tanggal' }))
    await pickDay(userEvent, /20 Oktober 2026/)
    await expect(
      canvas.getByRole('button', { name: 'Tanggal' }),
    ).toHaveTextContent('20 Okt 2026')
    await expect(canvas.getByLabelText('Nilai')).toHaveTextContent('2026-10-20')
  },
}

export const Multiple: Story = {
  render: () => <MultiplePreview />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Tanggal' }))
    await expect(screen.getAllByText('Pilih tanggal')).toHaveLength(2)
    await pickDay(userEvent, /20 Oktober 2026/)
    await pickDay(userEvent, /21 Oktober 2026/)
    const end = screen.getByRole('button', { name: /21 Oktober 2026/ })
    await expect(canvas.getByRole('button', { name: 'Tanggal' })).toHaveTextContent(
      'Pilih tanggal',
    )
    await expect(screen.getByText('20 Okt 2026, 21 Okt 2026')).toBeVisible()
    await expect(canvas.getByLabelText('Nilai')).toBeEmptyDOMElement()
    await userEvent.click(screen.getByRole('button', { name: 'Terapkan' }))
    await expect(canvas.getByRole('button', { name: 'Tanggal' })).toHaveTextContent(
      '20 Okt 2026, 21 Okt 2026',
    )
    await waitFor(() => {
      expect(end).not.toBeVisible()
    })
    await expect(canvas.getByLabelText('Nilai')).toHaveTextContent(
      '2026-10-20, 2026-10-21',
    )
  },
}

export const Range: Story = {
  render: () => <RangePreview />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Rentang' }))
    await expect(screen.getByText('Pilih tanggal mulai')).toBeVisible()
    await pickDay(userEvent, /20 Oktober 2026/)
    await expect(screen.getByText('20 Okt 2026 – …')).toBeVisible()
    const end = screen.getByRole('button', { name: /22 Oktober 2026/ })
    await expect(end).toBeVisible()
    await expect(canvas.getByLabelText('Nilai')).toHaveTextContent('kosong')
    await userEvent.click(end)
    await expect(canvas.getByLabelText('Nilai')).toHaveTextContent('kosong')
    await userEvent.click(screen.getByRole('button', { name: 'Terapkan' }))
    await expect(
      canvas.getByRole('button', { name: 'Rentang' }),
    ).toHaveTextContent('20 Okt 2026 – 22 Okt 2026')
    await waitFor(() => {
      expect(end).not.toBeVisible()
    })
    await expect(canvas.getByLabelText('Nilai')).toHaveTextContent(
      '2026-10-20 – 2026-10-22',
    )
  },
}

export const DisabledDates: Story = {
  render: () => <DisabledPreview />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Tanggal' }))
    await expect(
      await screen.findByRole('button', { name: /18 Oktober 2026/ }),
    ).toBeDisabled()
    await expect(
      screen.getByRole('button', { name: /15 Oktober 2026/ }),
    ).toBeDisabled()
    await userEvent.click(
      screen.getByRole('button', { name: /20 Oktober 2026/ }),
    )
    await expect(
      canvas.getByRole('button', { name: 'Tanggal' }),
    ).toHaveTextContent('20 Okt 2026')
  },
}
