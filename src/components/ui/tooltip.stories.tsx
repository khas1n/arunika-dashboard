import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Button } from './button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip'

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Arahkan</Button>
        </TooltipTrigger>
        <TooltipContent>Petunjuk</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
}
