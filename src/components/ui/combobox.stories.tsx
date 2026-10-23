import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '#/components/ui/combobox'

const feeds = [
  { value: '781', label: '781' },
  { value: 'safir', label: 'Safir' },
]

const meta = {
  title: 'UI/Combobox',
  component: Combobox,
  tags: ['autodocs'],
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Combobox items={feeds}>
      <ComboboxInput
        aria-label="Jenis pakan"
        placeholder="Jenis pakan"
        className="w-56"
      />
      <ComboboxContent>
        <ComboboxEmpty>Tidak ada jenis pakan.</ComboboxEmpty>
        <ComboboxList>
          {(feed: (typeof feeds)[number]) => (
            <ComboboxItem key={feed.value} value={feed}>
              {feed.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Jenis pakan' }))
    await userEvent.click(await canvas.findByRole('option', { name: 'Safir' }))
    await expect(
      canvas.getByRole('combobox', { name: 'Jenis pakan' }),
    ).toHaveValue('Safir')
  },
}
