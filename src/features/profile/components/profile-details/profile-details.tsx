import type { FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

interface ProfileSession {
  user: {
    name: string
    username: string
    email: string
    createdAt: string
  }
  session: {
    expiresAt: string
    ipAddress: string | null
    userAgent: string | null
  }
}

const dateTime = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'long',
  timeStyle: 'short',
})

function formatDate(value: string) {
  return dateTime.format(new Date(value))
}

interface ProfileDetailsProps {
  session: ProfileSession
}

export const ProfileDetails: FC<ProfileDetailsProps> = ({ session }) => {
  const rows = [
    ['Nama', session.user.name],
    ['Nama pengguna', session.user.username],
    ['Email', session.user.email],
    ['Bergabung', formatDate(session.user.createdAt)],
    ['Sesi berakhir', formatDate(session.session.expiresAt)],
    ['Alamat IP', session.session.ipAddress ?? 'Tidak diketahui'],
    ['Peramban', session.session.userAgent ?? 'Tidak diketahui'],
  ] as const

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-sm break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
