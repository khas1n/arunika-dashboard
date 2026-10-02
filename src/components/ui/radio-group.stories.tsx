import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { Label } from './label'
import { RadioGroup, RadioGroupItem } from './radio-group'

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Theme: Story = {
  render: () => (
    <RadioGroup defaultValue="system">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="light" id="story-light" />
        <Label htmlFor="story-light">Terang</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="dark" id="story-dark" />
        <Label htmlFor="story-dark">Gelap</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="system" id="story-system" />
        <Label htmlFor="story-system">Sistem</Label>
      </div>
    </RadioGroup>
  ),
}
