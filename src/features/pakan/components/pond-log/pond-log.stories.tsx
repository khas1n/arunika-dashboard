import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn, screen, waitFor } from 'storybook/test'

import { Toaster } from '#/components/ui/sonner'
import {
  formatGrams,
  formatPercent,
} from '#/features/pakan/components/pond-log/format-pond'
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
    fishSpeciesName: 'Nila',
    cultivationMethodName: 'Biofloc',
    fcr: null,
    totalDeaths: 16,
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
    fishSpeciesName: 'Nila',
    cultivationMethodName: 'Biofloc',
    fcr: 1.12,
    totalDeaths: 40,
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
    chartPoints: [
      { date: '2026-10-02', biomassGrams: 30000, deaths: 8 },
      { date: '2026-10-03', biomassGrams: 30000, deaths: 8 },
      { date: '2026-10-08', biomassGrams: 32000, deaths: 0 },
    ],
    onCreateOverride: fn(async () => {}),
    onRevokeOverride: fn(async () => {}),
    onUpsertDay: fn(async () => {}),
  },
} satisfies Meta<typeof PondLog>

export default meta
type Story = StoryObj<typeof meta>

export const TwoPonds: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText(`${formatGrams(1000)} g`)).toBeVisible()
    await expect(
      canvas.queryByText(`${formatGrams(2500)} g`),
    ).not.toBeInTheDocument()
    await expect(canvas.getByText(formatGrams(412))).toBeVisible()
    await expect(canvas.queryByText(formatGrams(4267))).not.toBeInTheDocument()
    await expect(canvas.getByText('Total kematian')).toBeVisible()
    await expect(canvas.getByText(formatGrams(16))).toBeVisible()
    await expect(canvas.getByText('FCR')).toBeVisible()
    await expect(
      canvas.queryByRole('img', { name: /Biomassa/ }),
    ).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Info kolam' }))
    await expect(screen.getByText('Jenis ikan')).toBeVisible()
    await expect(screen.getByText('Nila')).toBeVisible()
    await expect(screen.getByText('Metode budidaya')).toBeVisible()
    await expect(screen.getByText('Biofloc')).toBeVisible()
    await expect(canvas.getByText('Dadakan')).toBeVisible()
    await expect(canvas.getAllByText('0').length).toBeGreaterThan(0)
  },
}

export const OpensHarian: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Catat harian' }))
    await expect(
      await screen.findByRole('heading', { name: 'Catat harian' }),
    ).toBeVisible()
    await expect(screen.getByLabelText('Tanggal')).toBeVisible()
    await expect(screen.getByLabelText('Berat (g)')).toBeVisible()
    await expect(screen.getByLabelText('Kematian')).toBeVisible()
    await expect(screen.getByLabelText('Pakan aktual (g)')).toBeVisible()
  },
}

export const RecordsDadakan: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Puasa' }))
    await userEvent.click(
      canvas.getByRole('button', { name: 'Catat puasa dadakan' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Hari pertama' }))
    await userEvent.click(
      await screen.findByRole('button', { name: /10 Oktober 2026/ }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Hari terakhir' }))
    await userEvent.click(
      await screen.findByRole('button', { name: /12 Oktober 2026/ }),
    )
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

export const EditsCells: Story = {
  args: {
    days: [{ ...day, averageWeightGrams: null }, fastingDay],
    onUpsertDay: fn(async () => {}),
  },
  play: async ({ args, canvas, userEvent }) => {
    const cell = (name: string) => canvas.getAllByRole('button', { name })[0]
    const frMax = cell('Ubah FR max')
    const row = frMax.closest('tr')
    const before = row?.getBoundingClientRect().height ?? 0
    await userEvent.click(frMax)
    await expect(screen.getByLabelText('FR max')).toBeVisible()
    expect(Math.abs((row?.getBoundingClientRect().height ?? 0) - before)).toBe(
      0,
    )
    await userEvent.keyboard('{Escape}')
    await expect(cell('Ubah FR max')).toHaveTextContent(formatPercent(0.05))

    const berat = cell('Ubah Berat')
    await expect(berat).toHaveTextContent('—')
    await userEvent.click(berat)
    await expect(screen.getByLabelText('Berat')).toBeVisible()
    await userEvent.keyboard('{Escape}')

    const beratAgain = cell('Ubah Berat')
    await userEvent.hover(beratAgain)
    const icon = beratAgain.querySelector('[data-edit-icon]')
    expect(icon).not.toBeNull()
    await userEvent.click(beratAgain)
    await expect(screen.getByLabelText('Berat')).toBeVisible()
    await userEvent.keyboard('{Escape}')

    await userEvent.dblClick(cell('Ubah Kematian'))
    await expect(screen.getAllByLabelText('Kematian')).toHaveLength(1)
    await userEvent.keyboard('{Escape}')

    await userEvent.click(cell('Ubah FR max'))
    const frInput = screen.getByLabelText('FR max')
    await userEvent.clear(frInput)
    await userEvent.type(frInput, '150')
    await expect(frInput).toHaveAttribute('aria-invalid', 'true')
    await userEvent.keyboard('{Enter}')
    await expect(frInput).toBeVisible()
    await expect(args.onUpsertDay).not.toHaveBeenCalled()
    await userEvent.keyboard('{Escape}')

    await userEvent.click(cell('Ubah Kematian'))
    await userEvent.click(
      canvas.getByText('Satu halaman dari log.'),
    )
    await expect(screen.queryByLabelText('Kematian')).not.toBeInTheDocument()

    await userEvent.click(cell('Ubah Berat'))
    await userEvent.keyboard('{Tab}')
    await expect(screen.getByLabelText('FR min')).toHaveFocus()
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    await expect(screen.getByLabelText('Berat')).toHaveFocus()
    await userEvent.keyboard('{Escape}')

    await userEvent.click(cell('Ubah Kematian'))
    const deaths = screen.getByLabelText('Kematian')
    await userEvent.clear(deaths)
    await userEvent.type(deaths, '9')
    await userEvent.click(screen.getByRole('button', { name: 'Batal' }))
    await expect(args.onUpsertDay).not.toHaveBeenCalled()
    await expect(cell('Ubah Kematian')).toHaveTextContent('8')

    await userEvent.click(cell('Ubah Kematian'))
    const again = screen.getByLabelText('Kematian')
    await userEvent.clear(again)
    await userEvent.type(again, '9')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    await expect(args.onUpsertDay).toHaveBeenCalledWith(
      expect.objectContaining({ deaths: 9, create: false }),
    )
    await expect(cell('Ubah Kematian')).toHaveTextContent('9')

    await userEvent.click(cell('Ubah Pakan aktual'))
    const feed = screen.getByLabelText('Pakan aktual')
    await userEvent.clear(feed)
    await userEvent.type(feed, '500')
    await userEvent.keyboard('{Enter}')
    await expect(args.onUpsertDay).toHaveBeenCalledWith(
      expect.objectContaining({ actualFeedGrams: 500, deaths: 9 }),
    )
  },
}

export const RollsBackEdit: Story = {
  args: {
    onUpsertDay: fn(
      () =>
        new Promise((_resolve, reject) => {
          setTimeout(
            () => reject(new Error('Catatan harian gagal disimpan.')),
            200,
          )
        }),
    ),
  },
  render: (args) => (
    <>
      <Toaster />
      <PondLog {...args} />
    </>
  ),
  play: async ({ canvas, userEvent }) => {
    const cell = (name: string) => canvas.getAllByRole('button', { name })[0]
    await userEvent.click(cell('Ubah Kematian'))
    const input = screen.getByLabelText('Kematian')
    await userEvent.clear(input)
    await userEvent.type(input, '3')
    await userEvent.keyboard('{Enter}')
    await expect(cell('Ubah Kematian')).toHaveTextContent('3')
    await expect(
      await screen.findByText('Catatan harian gagal disimpan.'),
    ).toBeVisible()
    await waitFor(() => {
      expect(cell('Ubah Kematian')).toHaveTextContent('8')
    })
  },
}

export const Grafik: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Grafik' }))
    await expect(canvas.getByText('Seluruh siklus. 3 hari.')).toBeVisible()
    await expect(
      canvas.getByRole('img', {
        name: 'Biomassa kolam A3 sepanjang siklus',
      }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('img', { name: 'Kematian kolam A3' }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Rentang' }))
    await userEvent.click(
      await screen.findByRole('button', { name: /, 2 Oktober 2026/ }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: /, 3 Oktober 2026/ }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Terapkan' }))
    await expect(canvas.getByText(/2 hari/)).toBeVisible()
    await expect(
      canvas.queryByText('Seluruh siklus. 3 hari.'),
    ).not.toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: {
    cycle: null,
    chartPoints: [],
    days: [],
    bibis: [],
    overrides: [],
  },
}
