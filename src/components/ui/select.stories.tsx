import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="Treatment" className="w-56">
        <SelectValue placeholder="Pilih treatment" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="molase">Molase</SelectItem>
          <SelectItem value="gos">Gos Strong</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Treatment' }))
    await userEvent.click(await canvas.findByRole('option', { name: 'Molase' }))
    await expect(
      canvas.getByRole('combobox', { name: 'Treatment' }),
    ).toHaveTextContent('Molase')
  },
}
