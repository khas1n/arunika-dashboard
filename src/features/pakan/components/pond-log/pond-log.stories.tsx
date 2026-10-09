import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn, screen } from 'storybook/test'

import { formatGrams } from '#/features/pakan/components/pond-log/format-pond'
import { PondLog } from '#/features/pakan/components/pond-log/pond-log'
import type { KolamCycle, PondDay } from '#/features/pakan/schemas/kolam'

const cycles = [
  {
    id: 'a3',
    pondCode: 'A3',
    pondName: 'A3',
    seedSource: 'Kang Ipey - Subang',
    seedCount: 1400,
    volumeM3: 7,
    puasa: '5:1',
    feedName: 'Safir',
    fcr: null,
  },
  {
    id: 'a6',
    pondCode: 'A6',
    pondName: 'A6',
    seedSource: 'Kang Ipey - Subang',
    seedCount: 5600,
    volumeM3: 28,
    puasa: '6:1',
    feedName: '781',
    fcr: 1.12,
  },
] satisfies Array<KolamCycle>

const day = {
  date: '2026-10-02',
  doc: 13,
  averageWeightGrams: 25,
  frMin: 0.04,
  frMax: 0.05,
  deaths: 8,
  population: 1200,
  biomassGrams: 30000,
  calculatedFeedGrams: 1350,
  operationalFeedGrams: 1350,
  actualFeedGrams: 412,
  fastingReason: null,
} satisfies PondDay

const fastingDay = {
  ...day,
  doc: 14,
  date: '2026-10-03',
  operationalFeedGrams: 0,
  actualFeedGrams: 0,
  fastingReason: 'dadakan',
} satisfies PondDay

const meta = {
  title: 'Pakan/PondLog',
  component: PondLog,
  tags: ['autodocs'],
  args: {
    prepareOn: '2026-10-06',
    feedingOn: '2026-10-08',
    cycle: cycles[0],
    days: [day, fastingDay],
    bibis: [
      {
        batchPondId: 'a3',
        pondCode: 'A3',
        prepareOn: '2026-10-06',
        feedingOn: '2026-10-08',
        requiredGrams: 1000,
        remainingGrams: 1000,
        fastingReason: null,
      },
    ],
    overrides: [
      {
        id: 'override-1',
        startsOn: '2026-10-03',
        endsOn: '2026-10-03',
        reason: 'Air keruh',
        note: null,
        ended: false,
      },
    ],
    onCreateOverride: fn(async () => {}),
    onRevokeOverride: fn(async () => {}),
  },
} satisfies Meta<typeof PondLog>

export default meta
type Story = StoryObj<typeof meta>

export const TwoPonds: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(`${formatGrams(1000)} g`)).toBeVisible()
    await expect(
      canvas.queryByText(`${formatGrams(2500)} g`),
    ).not.toBeInTheDocument()
    await expect(canvas.getByText(formatGrams(412))).toBeVisible()
    await expect(canvas.queryByText(formatGrams(4267))).not.toBeInTheDocument()
    await expect(canvas.getByText('Dadakan')).toBeVisible()
    await expect(canvas.getAllByText('0').length).toBeGreaterThan(0)
  },
}

export const RecordsDadakan: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Puasa' }))
    await userEvent.click(
      canvas.getByRole('button', { name: 'Catat puasa dadakan' }),
    )
    await userEvent.type(screen.getByLabelText('Hari pertama'), '2026-10-10')
    await userEvent.type(screen.getByLabelText('Hari terakhir'), '2026-10-12')
    await userEvent.type(screen.getByLabelText('Alasan'), 'Hujan deras')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    await expect(args.onCreateOverride).toHaveBeenCalledWith({
      batchPondId: 'a3',
      startsOn: '2026-10-10',
      endsOn: '2026-10-12',
      reason: 'Hujan deras',
      note: '',
    })
  },
}

export const Empty: Story = {
  args: {
    cycle: null,
    days: [],
    bibis: [],
    overrides: [],
  },
}
