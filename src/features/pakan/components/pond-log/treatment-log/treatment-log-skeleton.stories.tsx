import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import { TreatmentLogSkeleton } from '#/features/pakan/components/pond-log/treatment-log/treatment-log-skeleton'

const meta = {
  title: 'Pakan/PondLog/TreatmentLogSkeleton',
  component: TreatmentLogSkeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof TreatmentLogSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByLabelText('Memuat treatment'),
    ).toBeInTheDocument()
  },
}
