import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn, screen, waitFor } from 'storybook/test'

import { Toaster } from '#/components/ui/sonner'
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
    fishSpeciesName: 'Nila',
    cultivationMethodName: 'Biofloc',
    fcr: null,
    totalDeaths: 16,
    cultureStart: '2026-09-20',
    todayWeightGrams: null,
    todayDeaths: null,
    todayFeedGrams: null,
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
    cultureStart: '2026-09-01',
    todayWeightGrams: null,
    todayDeaths: null,
    todayFeedGrams: null,
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
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
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
    treatments: [
      {
        id: 'log-1',
        treatmentId: 'aqua',
        treatmentCode: 'AQUA_CELL',
        treatmentName: 'Aqua Cell',
        quantityGrams: 200,
        occurredAt: '2026-10-20T08:55:00.000Z',
        userName: 'Administrator',
      },
      {
        id: 'log-2',
        treatmentId: 'basilus',
        treatmentCode: 'BASILUS',
        treatmentName: 'Basilus',
        quantityGrams: 1000,
        occurredAt: '2026-10-20T08:54:00.000Z',
        userName: 'Administrator',
      },
      {
        id: 'log-3',
        treatmentId: 'molase',
        treatmentCode: 'MOLASE',
        treatmentName: 'Molase',
        quantityGrams: 2000,
        occurredAt: '2026-09-29T17:00:00.000Z',
        userName: 'Administrator',
      },
    ],
    plannedTreatments: [
      { id: 'molase', code: 'MOLASE', name: 'Molase' },
      { id: 'basilus', code: 'BASILUS', name: 'Basilus' },
    ],
    treatmentOptions: [
      { id: 'molase', code: 'MOLASE', name: 'Molase' },
      { id: 'gos', code: 'GOS_STRONG', name: 'Gos Strong' },
      { id: 'aqua', code: 'AQUA_CELL', name: 'Aqua Cell' },
      { id: 'basilus', code: 'BASILUS', name: 'Basilus' },
    ],
    onCreateOverride: fn(async () => {}),
    onRevokeOverride: fn(async () => {}),
    onUpsertDay: fn(async () => {}),
    onCreateTreatment: fn(async () => {}),
    onUpdateTreatment: fn(async () => {}),
    onRevokeTreatment: fn(async () => {}),
  },
} satisfies Meta<typeof PondLog>

export default meta
type Story = StoryObj<typeof meta>

export const TreatmentTab: Story = {
  args: {
    treatmentRange: null,
    onTreatmentRangeChange: fn(),
    onFetchMoreTreatments: fn(),
    tab: 'treatment',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: 'Treatment' }),
    ).toBeVisible()
    await expect(canvas.getByText('Basilus')).toBeVisible()
    await expect(canvas.getByText('Molase')).toBeVisible()
    await expect(canvas.getByText('Aqua Cell')).toBeVisible()
    await expect(canvas.getAllByText('menambahkan').length).toBeGreaterThan(0)
    await expect(canvas.getByRole('button', { name: 'Catat' })).toBeVisible()
  },
}

export const TreatmentForm: Story = {
  args: { tab: 'treatment' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Catat' }))
    await expect(
      await screen.findByRole('heading', { name: 'Catat treatment' }),
    ).toBeVisible()
    await expect(
      screen.getByRole('combobox', { name: 'Treatment' }),
    ).toBeVisible()
  },
}

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
    const rows = canvas.getAllByRole('row')
    await expect(rows[1]).toHaveTextContent('3 Okt 2026')
    await expect(rows[2]).toHaveTextContent('2 Okt 2026')
  },
}

export const OpensHarian: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Catat' }))
    await expect(await screen.findByText('Hari ini')).toBeVisible()
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Tambah catatan harian' }),
    )
    await expect(
      await screen.findByRole('heading', { name: 'Tambah catatan harian' }),
    ).toBeVisible()
    await expect(screen.getByLabelText('Tanggal')).toBeVisible()
    await expect(screen.getByLabelText('Berat (g)')).toBeVisible()
    await expect(screen.getByLabelText('Kematian')).toBeVisible()
    await expect(screen.getByLabelText('Pakan aktual (g)')).toBeVisible()
    await expect(screen.queryByLabelText('FR min (%)')).not.toBeInTheDocument()
  },
}

const replaceWarning =
  'Catatan harian untuk 2 Oktober 2026. Jika Anda melanjutkan, data yang tersimpan untuk tanggal tersebut akan diganti dengan data baru. Apakah Anda yakin ingin melanjutkan?'

async function pickDay(userEvent: {
  click: (element: Element) => Promise<void>
}) {
  await userEvent.click(screen.getByRole('button', { name: 'Tanggal' }))
}

export const ReplacesHistory: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Catat' }))
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Tambah catatan harian' }),
    )
    await pickDay(userEvent)
    await userEvent.click(
      await screen.findByRole('button', { name: /, 2 Oktober 2026/ }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    await expect(await screen.findByText(replaceWarning)).toBeVisible()
  },
}

export const SavesNewDay: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Catat' }))
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Tambah catatan harian' }),
    )
    await pickDay(userEvent)
    await userEvent.click(
      await screen.findByRole('button', { name: /, 15 Oktober 2026/ }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    await expect(
      screen.queryByText(/Jika Anda melanjutkan/),
    ).not.toBeInTheDocument()
    await expect(args.onUpsertDay).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'day', date: '2026-10-15', deaths: 0 }),
    )
  },
}

export const TodayReminder: Story = {
  args: {
    cycle: {
      ...cycles[0],
      todayWeightGrams: 25,
      todayDeaths: null,
      todayFeedGrams: 0,
    },
  },
  play: async ({ canvas, userEvent }) => {
    await expect(
      await screen.findByText('Kematian hari ini belum dicatat.'),
    ).toBeVisible()
    await expect(
      screen.queryByText('Berat ikan hari ini belum dicatat.'),
    ).not.toBeInTheDocument()
    await expect(
      screen.queryByText('Aktual pakan hari ini belum dicatat.'),
    ).not.toBeInTheDocument()
    await expect(
      screen.queryByRole('button', { name: 'Tutup' }),
    ).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Catat' }))
    await expect(await screen.findAllByText('Sudah dicatat')).toHaveLength(2)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: 'Close toast' }))
    await waitFor(() => {
      expect(
        screen.queryByText('Kematian hari ini belum dicatat.'),
      ).not.toBeInTheDocument()
    })
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
    const berat = canvas
      .getAllByRole('button', { name: 'Ubah Berat' })
      .find((node) => node.textContent === '—')
    if (!berat) throw new Error('Missing empty weight cell')
    const row = berat.closest('tr')
    const before = row?.getBoundingClientRect().height ?? 0
    await userEvent.click(berat)
    await expect(screen.getByLabelText('Berat')).toBeVisible()
    expect(Math.abs((row?.getBoundingClientRect().height ?? 0) - before)).toBe(
      0,
    )
    await userEvent.keyboard('{Escape}')
    await expect(
      canvas
        .getAllByRole('button', { name: 'Ubah Berat' })
        .some((node) => node.textContent === '—'),
    ).toBe(true)

    const beratAgain = canvas
      .getAllByRole('button', { name: 'Ubah Berat' })
      .find((node) => node.textContent === '—')
    if (!beratAgain) throw new Error('Missing empty weight cell')
    await userEvent.hover(beratAgain)
    const icon = beratAgain.querySelector('[data-edit-icon]')
    expect(icon).not.toBeNull()
    await userEvent.click(beratAgain)
    await expect(screen.getByLabelText('Berat')).toBeVisible()
    await userEvent.keyboard('{Escape}')

    await userEvent.dblClick(cell('Ubah Kematian'))
    await expect(screen.getAllByLabelText('Kematian')).toHaveLength(1)
    await userEvent.keyboard('{Escape}')

    await userEvent.click(cell('Ubah Kematian'))
    await userEvent.click(canvas.getByRole('heading', { name: 'Kolam A3' }))
    await expect(screen.queryByLabelText('Kematian')).not.toBeInTheDocument()

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
      expect.objectContaining({ kind: 'deaths', deaths: 9 }),
    )
    await expect(cell('Ubah Kematian')).toHaveTextContent('9')

    await userEvent.click(cell('Ubah Pakan aktual'))
    const feed = screen.getByLabelText('Pakan aktual')
    await userEvent.clear(feed)
    await userEvent.type(feed, '500')
    await userEvent.keyboard('{Enter}')
    await expect(args.onUpsertDay).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'feed', actualFeedGrams: 500 }),
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
    treatments: [],
    plannedTreatments: [],
    treatmentOptions: [],
  },
}
