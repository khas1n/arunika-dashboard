import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn, screen } from 'storybook/test'
import { InventoryPage } from '#/features/pakan/components/inventory/inventory-page'
import type { InventoryOverview } from '#/features/pakan/schemas/inventory'

const overview = {
  prepareOn: '2026-10-22',
  stocks: [
    {
      feedId: 'pellet',
      feedName: '781',
      receivedGrams: 100_000,
      consumedGrams: 20_000,
      adjustmentGrams: -5_000,
      stockGrams: 75_000,
      lastReceipt: {
        quantityGrams: 50_000,
        occurredAt: new Date('2026-10-20T02:00:00.000Z'),
        note: null,
      },
    },
    {
      feedId: 'safir',
      feedName: 'Safir',
      receivedGrams: 800,
      consumedGrams: 100,
      adjustmentGrams: 0,
      stockGrams: 700,
      lastReceipt: null,
    },
  ],
  bibis: [
    {
      feedId: 'pellet',
      feedName: '781',
      feedingOn: '2026-10-24',
      stockGrams: 75_000,
      consumedGrams: 20_000,
      requiredGrams: 12_000,
      preparedGrams: 4_000,
      remainingGrams: 63_000,
      shortageGrams: 0,
      stillToPrepareGrams: 8_000,
      status: 'aman',
      missingPondCodes: [],
      ponds: [
        {
          batchPondId: 'a6',
          pondCode: 'A6',
          requiredGrams: 12_000,
          fasting: false,
          incomplete: false,
        },
      ],
    },
    {
      feedId: 'safir',
      feedName: 'Safir',
      feedingOn: '2026-10-24',
      stockGrams: 700,
      consumedGrams: 100,
      requiredGrams: 900,
      preparedGrams: 0,
      remainingGrams: -200,
      shortageGrams: 200,
      stillToPrepareGrams: 900,
      status: 'perlu-tambah',
      missingPondCodes: [],
      ponds: [
        {
          batchPondId: 'a3',
          pondCode: 'A3',
          requiredGrams: 900,
          fasting: false,
          incomplete: false,
        },
      ],
    },
  ],
  unassignedPonds: [],
} satisfies InventoryOverview

const meta = {
  title: 'Pakan/InventoryPage',
  component: InventoryPage,
  tags: ['autodocs'],
  args: {
    overview,
    activity: [
      {
        id: 'receipt:1',
        sourceId: '1',
        type: 'receipt',
        occurredAt: new Date('2026-10-20T02:00:00.000Z'),
        feedId: 'pellet',
        feedName: '781',
        quantityGrams: 50_000,
        pondCode: null,
        userName: 'Admin',
        note: null,
      },
      {
        id: 'application:1',
        sourceId: '2',
        type: 'application',
        occurredAt: new Date('2026-10-21T01:00:00.000Z'),
        feedId: 'pellet',
        feedName: '781',
        quantityGrams: 100,
        pondCode: 'A6',
        userName: 'Admin',
        note: null,
      },
    ],
    activityCount: 2,
    activityType: 'all',
    onActivityTypeChange: fn(),
    onCreateReceipt: fn(async () => {}),
    onCreateBibis: fn(async () => {}),
    onCreateOpname: fn(async () => {}),
  },
} satisfies Meta<typeof InventoryPage>

export default meta
type Story = StoryObj<typeof meta>

export const Shortage: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Bibis' })).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'Pakan' })).toBeVisible()
    await expect(
      canvas.getByRole('textbox', { name: 'Cari riwayat' }),
    ).toBeVisible()
    await expect(
      canvas.queryByRole('heading', { name: 'Riwayat' }),
    ).not.toBeInTheDocument()
    await expect(canvas.getByText('Perlu tambah bibis')).toBeVisible()
    await expect(canvas.getByText('Aman')).toBeVisible()
    await expect(canvas.getByText('84%')).toBeVisible()
    await expect(canvas.getByText('0%')).toBeVisible()
    await expect(canvas.queryByRole('tab')).not.toBeInTheDocument()
    await expect(
      canvas.queryByRole('button', { name: 'Riwayat' }),
    ).not.toBeInTheDocument()
  },
}

export const Incomplete: Story = {
  args: {
    overview: {
      ...overview,
      bibis: [
        {
          ...overview.bibis[0],
          status: 'aman',
          missingPondCodes: ['A6'],
          ponds: [
            {
              batchPondId: 'a6',
              pondCode: 'A6',
              requiredGrams: null,
              fasting: false,
              incomplete: true,
            },
          ],
        },
      ],
      unassignedPonds: [
        {
          batchPondId: 'b3',
          pondCode: 'B3',
          requiredGrams: null,
          fasting: false,
          incomplete: true,
        },
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('84%')).toBeVisible()
    await expect(
      canvas.queryByText('Data belum lengkap'),
    ).not.toBeInTheDocument()
    await expect(canvas.getByText(/B3 belum punya jenis pakan/)).toBeVisible()
  },
}

export const Empty: Story = {
  args: {
    overview: {
      prepareOn: '2026-10-22',
      stocks: [],
      bibis: [],
      unassignedPonds: [],
    },
    activity: [],
    activityCount: 0,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Belum ada jenis pakan.')).toBeVisible()
    await expect(canvas.getByText('Belum ada bibis.')).toBeVisible()
    await expect(canvas.getByText('Belum ada pergerakan stok.')).toBeVisible()
  },
}

export const Error: Story = {
  args: {
    overview: null,
    isError: true,
    errorMessage: 'Stok gagal dimuat.',
    onRetry: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Stok gagal dimuat.')).toBeVisible()
  },
}

export const OpensReceipt: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole('button', { name: 'Tambah' })[0])
    await expect(
      await screen.findByRole('heading', { name: 'Tambah' }),
    ).toBeVisible()
  },
}
