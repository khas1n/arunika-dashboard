import type { FC } from 'react'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { ProfileDetails } from '#/features/profile/components/profile-details'

const routeApi = getRouteApi('/_authenticated/profile')

const ProfilePage: FC = () => {
  const { session } = routeApi.useRouteContext()

  return <ProfileDetails session={session} />
}

export const Route = createFileRoute('/_authenticated/profile')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Profil | Arunika' }],
  }),
  component: ProfilePage,
})
