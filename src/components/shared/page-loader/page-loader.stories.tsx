import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { PageLoader } from './page-loader'

const meta = {
  title: 'Shared/PageLoader',
  component: PageLoader,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PageLoader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
