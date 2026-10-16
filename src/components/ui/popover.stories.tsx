import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen } from 'storybook/test'
import { Button } from '#/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '#/components/ui/popover'

const meta = {
  title: 'UI/Popover',
  component: Popover,
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Buka</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Tanggal panen</PopoverTitle>
          <PopoverDescription>Pilih hari dari kalender.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
  play: async ({ userEvent }) => {
    await userEvent.click(screen.getByRole('button', { name: 'Buka' }))
    await expect(screen.getByText('Tanggal panen')).toBeVisible()
  },
}
