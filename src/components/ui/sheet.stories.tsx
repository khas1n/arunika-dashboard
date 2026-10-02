import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Button } from './button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet'

const meta = {
  title: 'UI/Sheet',
  component: Sheet,
  tags: ['autodocs'],
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Buka</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Panel</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
}
