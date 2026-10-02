import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { ProfileDetails } from './profile-details'

const meta = {
  title: 'Profile/ProfileDetails',
  component: ProfileDetails,
  tags: ['autodocs'],
  args: {
    session: {
      user: {
        name: 'Administrator',
        username: 'admin',
        email: 'admin@arunika.local',
        createdAt: '2026-10-01T12:00:00.000Z',
      },
      session: {
        expiresAt: '2026-10-08T12:00:00.000Z',
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome',
      },
    },
  },
} satisfies Meta<typeof ProfileDetails>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const UnknownClient: Story = {
  args: {
    session: {
      user: {
        name: 'Administrator',
        username: 'admin',
        email: 'admin@arunika.local',
        createdAt: '2026-10-01T12:00:00.000Z',
      },
      session: {
        expiresAt: '2026-10-08T12:00:00.000Z',
        ipAddress: null,
        userAgent: null,
      },
    },
  },
}
