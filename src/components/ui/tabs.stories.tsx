import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { CalendarDays, UtensilsCrossed } from 'lucide-react'
import { expect } from 'storybook/test'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="harian">
      <TabsList>
        <TabsTrigger value="harian">
          <CalendarDays />
          Harian
        </TabsTrigger>
        <TabsTrigger value="puasa">
          <UtensilsCrossed />
          Puasa
        </TabsTrigger>
      </TabsList>
      <TabsContent value="harian">Catatan harian</TabsContent>
      <TabsContent value="puasa">Puasa dadakan</TabsContent>
    </Tabs>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('Catatan harian')).toBeVisible()
    await userEvent.click(canvas.getByRole('tab', { name: 'Puasa' }))
    await expect(canvas.getByText('Puasa dadakan')).toBeVisible()
  },
}
