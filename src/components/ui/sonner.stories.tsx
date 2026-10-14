import type { FC } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen } from 'storybook/test'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Toaster } from '#/components/ui/sonner'

const SonnerDemo: FC = () => {
  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => toast.success('Catatan harian tersimpan.')}
      >
        Tampilkan
      </Button>
      <Toaster />
    </>
  )
}

const meta = {
  title: 'UI/Sonner',
  component: Toaster,
  tags: ['autodocs'],
  render: () => <SonnerDemo />,
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Tampilkan' }))
    await expect(
      await screen.findByText('Catatan harian tersimpan.'),
    ).toBeVisible()
  },
}
