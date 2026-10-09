import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'

import { AppSidebar } from './app-sidebar'

const meta = {
  title: 'Layout/AppSidebar',
  component: AppSidebar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset />
    </SidebarProvider>
  ),
}

export const WithPonds: Story = {
  render: () => (
    <SidebarProvider>
      <AppSidebar
        ponds={[
          { code: 'A3', name: 'A3' },
          { code: 'D3', name: 'D3' },
          { code: 'A6', name: 'A6' },
        ]}
      />
      <SidebarInset />
    </SidebarProvider>
  ),
}
