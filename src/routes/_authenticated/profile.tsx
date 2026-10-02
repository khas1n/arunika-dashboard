import { createFileRoute } from '@tanstack/react-router'
import { ProfileDetails } from '#/features/profile/components/profile-details'

export const Route = createFileRoute('/_authenticated/profile')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Profil | Arunika' }],
  }),
  component: ProfilePage,
})

function ProfilePage() {
  const { session } = Route.useRouteContext()

  return <ProfileDetails session={session} />
}
