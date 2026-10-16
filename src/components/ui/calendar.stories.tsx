import { useState } from 'react'
import type { FC } from 'react'
import type { DateRange } from '@daypicker/react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen } from 'storybook/test'
import { Calendar } from '#/components/ui/calendar'

const october = new Date(2026, 9, 1)

const SinglePreview: FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 16))
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      defaultMonth={october}
      className="rounded-md border"
    />
  )
}

const MultiplePreview: FC = () => {
  const [dates, setDates] = useState<Date[] | undefined>([
    new Date(2026, 9, 12),
    new Date(2026, 9, 14),
  ])
  return (
    <Calendar
      mode="multiple"
      selected={dates}
      onSelect={setDates}
      defaultMonth={october}
      className="rounded-md border"
    />
  )
}

const RangePreview: FC = () => {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 9, 12),
    to: new Date(2026, 9, 16),
  })
  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange}
      defaultMonth={october}
      className="rounded-md border"
    />
  )
}

const DisabledPreview: FC = () => {
  const [date, setDate] = useState<Date | undefined>()
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      defaultMonth={october}
      disabled={[{ dayOfWeek: [0, 6] }, new Date(2026, 9, 15)]}
      className="rounded-md border"
    />
  )
}

const meta = {
  title: 'UI/Calendar',
  component: Calendar,
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {
  render: () => <SinglePreview />,
  play: async () => {
    await expect(
      screen.getByRole('button', { name: /16 Oktober 2026/ }),
    ).toHaveAttribute('data-selected-single', 'true')
  },
}

export const Multiple: Story = {
  render: () => <MultiplePreview />,
}

export const Range: Story = {
  render: () => <RangePreview />,
}

export const DisabledDates: Story = {
  render: () => <DisabledPreview />,
  play: async ({ userEvent }) => {
    const sunday = screen.getByRole('button', { name: /18 Oktober 2026/ })
    const holiday = screen.getByRole('button', { name: /15 Oktober 2026/ })
    await expect(sunday).toBeDisabled()
    await expect(holiday).toBeDisabled()
    await userEvent.click(
      screen.getByRole('button', { name: /20 Oktober 2026/ }),
    )
    await expect(
      screen.getByRole('button', { name: /20 Oktober 2026/ }),
    ).toHaveAttribute('data-selected-single', 'true')
  },
}
