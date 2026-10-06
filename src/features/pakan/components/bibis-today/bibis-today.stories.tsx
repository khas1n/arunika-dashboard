import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'

import { formatGrams } from '#/features/pakan/components/pond-log/format-pond'
import { BibisToday } from './bibis-today'

const meta = {
  title: 'Pakan/BibisToday',
  component: BibisToday,
  tags: ['autodocs'],
  args: {
    prepareOn: '2026-10-06',
    feedingOn: '2026-10-08',
    items: [
      {
        batchPondId: 'a3',
        pondCode: 'A3',
        feedingOn: '2026-10-08',
        requiredGrams: 1000,
        remainingGrams: 1000,
        fastingReason: null,
      },
      {
        batchPondId: 'a6',
        pondCode: 'A6',
        feedingOn: '2026-10-08',
        requiredGrams: 0,
        remainingGrams: 0,
        fastingReason: 'dadakan',
      },
    ],
  },
} satisfies Meta<typeof BibisToday>

export default meta
type Story = StoryObj<typeof meta>

export const TwoPonds: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(`${formatGrams(1000)} g`)).toBeVisible()
    await expect(canvas.getByText('Puasa dadakan, 0 g')).toBeVisible()
    await expect(
      canvas.queryByText(`${formatGrams(2500)} g`),
    ).not.toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: { items: [] },
}
