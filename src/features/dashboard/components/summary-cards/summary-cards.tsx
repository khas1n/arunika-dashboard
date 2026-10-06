import type { FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

interface SummaryCardsProps {
  userCount: number
  sessionCount: number
}

export const SummaryCards: FC<SummaryCardsProps> = ({
  userCount,
  sessionCount,
}) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total pengguna
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{userCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Sesi aktif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{sessionCount}</p>
        </CardContent>
      </Card>
    </div>
  )
}
