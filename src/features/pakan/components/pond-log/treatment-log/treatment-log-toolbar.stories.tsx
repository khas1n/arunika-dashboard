import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'
import { TreatmentLogToolbar } from '#/features/pakan/components/pond-log/treatment-log/treatment-log-toolbar'

const meta = {
  title: 'Pakan/PondLog/TreatmentLogToolbar',
  component: TreatmentLogToolbar,
  tags: ['autodocs'],
  args: {
    range: null,
    onRangeChange: fn(),
  },
} satisfies Meta<typeof TreatmentLogToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: /Semua tanggal|Pilih rentang/ }),
    ).toBeVisible()
  },
}
