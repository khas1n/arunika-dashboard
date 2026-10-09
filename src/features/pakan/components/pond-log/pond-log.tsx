import { useState } from 'react'
import type { FC } from 'react'
import { CalendarDays, UtensilsCrossed } from 'lucide-react'
import {
  DataTableConfirmDialog,
  DataTableDialog,
  DataTableFrame,
  DataTableSelectionBar,
  useAppTable,
} from '#/components/shared/data-table'
import type { ServerTableControls } from '#/components/shared/data-table'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { BibisToday } from '#/features/pakan/components/bibis-today'
import { FastingOverrideForm } from '#/features/pakan/components/fasting-override-form'
import { BiomassChart } from '#/features/pakan/components/pond-log/biomass-chart'
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
  BiomassPoint,
  FastingOverrideInput,
  FastingOverrideItem,
  KolamCycle,
  PondDay,
} from '#/features/pakan/schemas/kolam'

interface PondLogProps {
  prepareOn: string
  feedingOn: string
  cycle: KolamCycle | null
  series: Array<BiomassPoint>
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
  series,
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
  const [tab, setTab] = useState('harian')
  const [recording, setRecording] = useState(false)
  const [ending, setEnding] = useState<FastingOverrideItem>()
  const [endingIds, setEndingIds] = useState<Array<string>>([])
  const [pendingEnd, setPendingEnd] = useState(false)
  const [endError, setEndError] = useState<string>()
  const table = useAppTable({
    data: days,
    columns: pondDayColumns,
    getRowId: (row) => String(row.doc),
    enableRowSelection: false,
    initialState: { columnPinning: { start: ['date'], end: [] } },
    ...(dayTable ? { ...dayTable, rowCount: dayRowCount ?? days.length } : {}),
  })
  const overridesGrid = useAppTable({
    data: overrides,
    columns: overrideColumns,
    getRowId: (row) => row.id,
    enableRowSelection: (row) => !row.original.ended,
    ...(overrideTable
      ? { ...overrideTable, rowCount: overrideRowCount ?? overrides.length }
      : {}),
  })
  const endingCount = endingIds.length

  return (
    <section className="grid min-w-0 gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {cycle ? `Kolam ${cycle.pondCode}` : 'Kolam'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Catatan harian, pakan aktual, dan bibis untuk kolam ini.
          </p>
        </div>
        {cycle && tab === 'puasa' ? (
          <Button type="button" size="sm" onClick={() => setRecording(true)}>
            Catat puasa dadakan
          </Button>
        ) : null}
      </div>

      {cycle == null ? (
        <p className="text-sm text-muted-foreground">
          Belum ada data kolam. Jalankan impor BATCH 1.
        </p>
      ) : (
        <Tabs
          value={tab}
          onValueChange={setTab}
          className="min-w-0 gap-6"
        >
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
          <BibisToday
            prepareOn={prepareOn}
            feedingOn={feedingOn}
            items={bibis}
          />
          <TabsContent value="harian" className="grid min-w-0 gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                label="Asal bibit"
                value={cycle.seedSource ?? '—'}
              />
              <MetricCard
                label="Jumlah bibit"
                value={formatGrams(cycle.seedCount)}
              />
              <MetricCard
                label="Volume (m3)"
                value={formatQuantity(cycle.volumeM3)}
              />
              <MetricCard label="Puasa" value={cycle.puasa ?? 'Belum diatur'} />
              <MetricCard label="Pakan" value={cycle.feedName ?? '—'} />
              <MetricCard label="FCR" value={formatFcr(cycle.fcr)} />
            </div>
            <BiomassChart pondCode={cycle.pondCode} points={series} />
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Catatan harian</CardTitle>
                <CardDescription>
                  Satu halaman dari log. Grafik di atas memakai seluruh siklus.
                </CardDescription>
              </CardHeader>
              <CardContent className="min-w-0">
                <DataTableFrame>
                  <table.AppTable>
                    <table.Grid
                      emptyLabel="Belum ada catatan harian."
                      isFetching={daysFetching}
                    />
                    <table.Pagination />
                  </table.AppTable>
                </DataTableFrame>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="puasa" className="grid min-w-0 gap-4">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Puasa dadakan</CardTitle>
                <CardDescription>
                  Baris yang masih aktif bisa diakhiri. Yang sudah diakhiri
                  tetap tersimpan.
                </CardDescription>
              </CardHeader>
              <CardContent className="min-w-0">
                <OverrideEndProvider
                  onEnd={(override) => {
                    setEndError(undefined)
                    setEndingIds([])
                    setEnding(override)
                  }}
                >
                  <DataTableFrame>
                    <DataTableSelectionBar
                      actionLabel="Akhiri"
                      pending={pendingEnd}
                      onAction={(ids) => {
                        setEndError(undefined)
                        setEnding(undefined)
                        setEndingIds(ids)
                      }}
                    >
                      <overridesGrid.AppTable>
                        <overridesGrid.Grid
                          emptyLabel="Belum ada puasa dadakan."
                          isFetching={overridesFetching}
                        />
                        <overridesGrid.Pagination />
                      </overridesGrid.AppTable>
                    </DataTableSelectionBar>
                  </DataTableFrame>
                </OverrideEndProvider>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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

      <DataTableConfirmDialog
        open={endingCount > 0}
        onOpenChange={(open) => {
          if (!open && !pendingEnd) {
            setEndingIds([])
            setEndError(undefined)
          }
        }}
        title={`Akhiri ${endingCount} puasa dadakan?`}
        description="Hanya baris yang masih aktif yang terpilih. Yang sudah diakhiri tidak berubah."
        confirmLabel="Akhiri"
        pending={pendingEnd}
        error={endError}
        onConfirm={() => {
          const ids = endingIds
          setPendingEnd(true)
          setEndError(undefined)
          void (async () => {
            const failed: Array<string> = []
            let message: string | undefined
            for (const id of ids) {
              try {
                await onRevokeOverride(id)
              } catch (error: unknown) {
                failed.push(id)
                message ??=
                  error instanceof Error
                    ? error.message
                    : 'Terjadi kesalahan. Coba lagi.'
              }
            }
            overridesGrid.setRowSelection(
              Object.fromEntries(failed.map((id) => [id, true])),
            )
            if (failed.length === 0) setEndingIds([])
            else {
              setEndingIds(failed)
              setEndError(message)
            }
          })().finally(() => setPendingEnd(false))
        }}
      />
    </section>
  )
}

interface MetricCardProps {
  label: string
  value: string
}

const MetricCard: FC<MetricCardProps> = ({ label, value }) => {
  return (
    <Card>
      <CardHeader className="gap-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
