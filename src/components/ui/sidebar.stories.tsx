import type { Meta, StoryObj } from '@storybook/tanstack-react'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from './sidebar'

const meta = {
  title: 'UI/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-4 py-3 text-sm font-semibold">
          Arunika
        </SidebarHeader>
        <SidebarContent />
      </Sidebar>
      <SidebarInset className="p-6">Konten</SidebarInset>
    </SidebarProvider>
  ),
}
