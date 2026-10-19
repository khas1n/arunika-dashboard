import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'

import {
  BiomassChart,
  MortalityChart,
} from '#/features/pakan/components/pond-log/biomass-chart'

const meta = {
  title: 'Pakan/BiomassChart',
  component: BiomassChart,
  tags: ['autodocs'],
  args: {
    pondCode: 'A3',
    points: [
      { date: '2026-10-02', biomassGrams: 28000 },
      { date: '2026-10-03', biomassGrams: 30000 },
      { date: '2026-10-04', biomassGrams: 31500 },
    ],
  },
} satisfies Meta<typeof BiomassChart>

export default meta
type Story = StoryObj<typeof meta>

export const History: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', {
        name: 'Biomassa kolam A3 sepanjang siklus',
      }),
    ).toBeVisible()
  },
}

export const Empty: Story = {
  args: { points: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Belum ada biomassa.')).toBeVisible()
  },
}

export const Deaths: Story = {
  render: () => (
    <MortalityChart
      pondCode="A3"
      points={[
        { date: '2026-10-02', deaths: 8 },
        { date: '2026-10-03', deaths: 0 },
      ]}
    />
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: 'Kematian kolam A3' }),
    ).toBeVisible()
    await expect(
      canvas.getByText(
        'Kematian per hari, dalam ekor. Hari dengan nol kematian tetap tampil.',
      ),
    ).toBeVisible()
  },
}
