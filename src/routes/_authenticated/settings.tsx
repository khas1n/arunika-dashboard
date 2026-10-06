import type { FC } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PreferencesForm } from '#/features/settings/components/preferences-form'

const SettingsPage: FC = () => {
  return (
    <section className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Preferensi ini tersimpan di peramban Anda.
        </p>
      </div>
      <PreferencesForm />
    </section>
  )
}

export const Route = createFileRoute('/_authenticated/settings')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Pengaturan | Arunika' }],
  }),
  component: SettingsPage,
})
