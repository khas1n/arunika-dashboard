import { useState } from 'react'
import type { FC } from 'react'
import { CalendarDays, UtensilsCrossed } from 'lucide-react'
import {
  DataTableConfirmDialog,
  DataTableDialog,
  DataTableFrame,
  useAppTable,
} from '#/components/shared/data-table'
import type { ServerTableControls } from '#/components/shared/data-table'
import { Button } from '#/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { BibisToday } from '#/features/pakan/components/bibis-today'
import { FastingOverrideForm } from '#/features/pakan/components/fasting-override-form'
import {
  formatFcr,
  formatGrams,
  formatQuantity,
} from '#/features/pakan/components/pond-log/format-pond'
import {
  OverrideEndProvider,
  overrideColumns,
} from '#/features/pakan/components/pond-log/override-columns'
import { pondDayColumns } from '#/features/pakan/components/pond-log/pond-day-columns'
import type {
  BibisLine,
  FastingOverrideInput,
  FastingOverrideItem,
  KolamCycle,
  PondDay,
} from '#/features/pakan/schemas/kolam'

interface PondLogProps {
  prepareOn: string
  feedingOn: string
  cycle: KolamCycle | null
  days: Array<PondDay>
  dayRowCount?: number
  dayTable?: ServerTableControls
  daysFetching?: boolean
  bibis: Array<BibisLine>
  overrides: Array<FastingOverrideItem>
  overrideRowCount?: number
  overrideTable?: ServerTableControls
  overridesFetching?: boolean
  onCreateOverride: (values: FastingOverrideInput) => Promise<unknown>
  onRevokeOverride: (id: string) => Promise<unknown>
}

export const PondLog: FC<PondLogProps> = ({
  prepareOn,
  feedingOn,
  cycle,
  days,
  dayRowCount,
  dayTable,
  daysFetching = false,
  bibis,
  overrides,
  overrideRowCount,
  overrideTable,
  overridesFetching = false,
  onCreateOverride,
  onRevokeOverride,
}) => {
  const [recording, setRecording] = useState(false)
  const [ending, setEnding] = useState<FastingOverrideItem>()
  const [pendingEnd, setPendingEnd] = useState(false)
  const [endError, setEndError] = useState<string>()
  const table = useAppTable({
    data: days,
    columns: pondDayColumns,
    getRowId: (row) => String(row.doc),
    initialState: { columnPinning: { start: ['date'], end: [] } },
    ...(dayTable ? { ...dayTable, rowCount: dayRowCount ?? days.length } : {}),
  })
  const overridesGrid = useAppTable({
    data: overrides,
    columns: overrideColumns,
    getRowId: (row) => row.id,
    ...(overrideTable
      ? { ...overrideTable, rowCount: overrideRowCount ?? overrides.length }
      : {}),
  })

  return (
    <section className="grid min-w-0 gap-6">
      <BibisToday prepareOn={prepareOn} feedingOn={feedingOn} items={bibis} />

      {cycle == null ? (
        <p className="text-sm text-muted-foreground">
          Belum ada data kolam. Jalankan impor BATCH 1.
        </p>
      ) : (
        <>
          <Tabs defaultValue="harian" className="min-w-0">
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
            <TabsContent value="harian" className="grid min-w-0 gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <HeaderFact
                  label="Asal bibit"
                  value={cycle.seedSource ?? '—'}
                />
                <HeaderFact
                  label="Jumlah bibit"
                  value={formatGrams(cycle.seedCount)}
                />
                <HeaderFact
                  label="Volume (m3)"
                  value={formatQuantity(cycle.volumeM3)}
                />
                <HeaderFact
                  label="Puasa"
                  value={cycle.puasa ?? 'Belum diatur'}
                />
                <HeaderFact label="Pakan" value={cycle.feedName ?? '—'} />
                <HeaderFact label="FCR" value={formatFcr(cycle.fcr)} />
              </div>
              <DataTableFrame>
                <table.AppTable>
                  <table.Grid
                    emptyLabel="Belum ada catatan harian."
                    isFetching={daysFetching}
                  />
                  <table.Pagination />
                </table.AppTable>
              </DataTableFrame>
            </TabsContent>
            <TabsContent value="puasa" className="grid min-w-0 gap-4">
              <div className="flex flex-wrap items-end justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setRecording(true)}
                >
                  Catat puasa dadakan
                </Button>
              </div>
              <OverrideEndProvider
                onEnd={(override) => {
                  setEndError(undefined)
                  setEnding(override)
                }}
              >
                <DataTableFrame>
                  <overridesGrid.AppTable>
                    <overridesGrid.Grid
                      emptyLabel="Belum ada puasa dadakan."
                      isFetching={overridesFetching}
                    />
                    <overridesGrid.Pagination />
                  </overridesGrid.AppTable>
                </DataTableFrame>
              </OverrideEndProvider>
            </TabsContent>
          </Tabs>
        </>
      )}

      <DataTableDialog
        open={recording}
        onOpenChange={setRecording}
        title="Puasa dadakan"
        description={
          cycle
            ? `Catat puasa dadakan untuk kolam ${cycle.pondCode}. Pola puasa tidak berubah.`
            : 'Catat puasa dadakan.'
        }
      >
        {cycle ? (
          <FastingOverrideForm
            batchPondId={cycle.id}
            onCancel={() => setRecording(false)}
            onSubmit={async (values) => {
              await onCreateOverride(values)
              setRecording(false)
            }}
          />
        ) : null}
      </DataTableDialog>

      <DataTableConfirmDialog
        open={ending != null}
        onOpenChange={(open) => {
          if (!open) setEnding(undefined)
        }}
        title="Akhiri puasa dadakan?"
        description="Hari-hari yang tersisa kembali mengikuti pola puasa. Catatan ini tetap tersimpan."
        confirmLabel="Akhiri"
        pending={pendingEnd}
        error={endError}
        onConfirm={() => {
          if (!ending) return
          setPendingEnd(true)
          setEndError(undefined)
          void onRevokeOverride(ending.id)
            .then(() => setEnding(undefined))
            .catch((error: unknown) => {
              setEndError(
                error instanceof Error
                  ? error.message
                  : 'Terjadi kesalahan. Coba lagi.',
              )
            })
            .finally(() => setPendingEnd(false))
        }}
      />
    </section>
  )
}

interface HeaderFactProps {
  label: string
  value: string
}

const HeaderFact: FC<HeaderFactProps> = ({ label, value }) => {
  return (
    <div className="grid gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
