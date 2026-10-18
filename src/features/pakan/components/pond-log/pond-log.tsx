import { useState } from 'react'
import type { FC } from 'react'
import type { DateRange } from '@daypicker/react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CalendarDays, ChartLine, Info, UtensilsCrossed } from 'lucide-react'
import { AppDialog } from '#/components/shared/app-dialog'
import { useAppForm } from '#/components/shared/form'
import { ConfirmDialog } from '#/components/shared/confirm-dialog'
import {
  DataTableFrame,
  DataTableSelectionBar,
  useAppTable,
} from '#/components/shared/data-table'
import type { ServerTableControls } from '#/components/shared/data-table'
import { Button } from '#/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '#/components/ui/popover'
import { kolamChartQueryOptions } from '#/features/pakan/api/kolam.queries'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { FastingOverrideForm } from '#/features/pakan/components/fasting-override-form'
import { PondDayForm } from '#/features/pakan/components/pond-day-form'
import {
  BiomassChart,
  MortalityChart,
} from '#/features/pakan/components/pond-log/biomass-chart'
import {
  formatCalendar,
  formatFcr,
  formatGrams,
  formatQuantity,
} from '#/features/pakan/components/pond-log/format-pond'
import {
  OverrideEndProvider,
  overrideColumns,
} from '#/features/pakan/components/pond-log/override-columns'
import { pondDayColumns } from '#/features/pakan/components/pond-log/pond-day-columns'
import { PondDayEditProvider } from '#/features/pakan/components/pond-log/pond-day-cell'
import type {
  BibisLine,
  FastingOverrideInput,
  FastingOverrideItem,
  KolamChartPoint,
  KolamCycle,
  PondDay,
  PondDayWrite,
} from '#/features/pakan/schemas/kolam'

interface PondLogProps {
  prepareOn: string
  feedingOn: string
  cycle: KolamCycle | null
  chartPoints?: Array<KolamChartPoint>
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
  onUpsertDay: (values: PondDayWrite) => Promise<unknown>
}

export const PondLog: FC<PondLogProps> = ({
  prepareOn,
  feedingOn,
  cycle,
  chartPoints,
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
  onUpsertDay,
}) => {
  const [tab, setTab] = useState('harian')
  const [recording, setRecording] = useState(false)
  const [recordingDay, setRecordingDay] = useState(false)
  const [ending, setEnding] = useState<FastingOverrideItem>()
  const [endingIds, setEndingIds] = useState<Array<string>>([])
  const [pendingEnd, setPendingEnd] = useState(false)
  const [endError, setEndError] = useState<string>()
  const table = useAppTable({
    data: days,
    columns: pondDayColumns,
    getRowId: (row) => String(row.doc),
    enableRowSelection: false,
    initialState: {
      columnPinning: { start: ['date'], end: [] },
      pagination: { pageIndex: 0, pageSize: 25 },
    },
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
          <div className="flex items-center gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {cycle ? `Kolam ${cycle.pondCode}` : 'Kolam'}
            </h1>
            {cycle ? <PondFacts cycle={cycle} /> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Catatan harian, pakan aktual, dan bibis untuk kolam ini.
          </p>
        </div>
        {cycle && tab === 'harian' ? (
          <Button type="button" size="sm" onClick={() => setRecordingDay(true)}>
            Catat harian
          </Button>
        ) : null}
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
        <div className="grid gap-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Bibis"
              value={bibisAmount(bibis[0])}
              detail={`Siapkan pada ${formatCalendar(prepareOn)} untuk pemberian ${formatCalendar(feedingOn)}.`}
            />
            <MetricCard
              label="Total kematian"
              value={formatGrams(cycle.totalDeaths)}
              detail="Seluruh siklus aktif."
            />
            <MetricCard label="FCR" value={formatFcr(cycle.fcr)} />
          </div>
          <Tabs value={tab} onValueChange={setTab} className="min-w-0 gap-6">
            <TabsList>
              <TabsTrigger value="harian">
                <CalendarDays />
                Harian
              </TabsTrigger>
              <TabsTrigger value="puasa">
                <UtensilsCrossed />
                Puasa
              </TabsTrigger>
              <TabsTrigger value="grafik">
                <ChartLine />
                Grafik
              </TabsTrigger>
            </TabsList>
            <TabsContent value="harian" className="grid min-w-0 gap-4">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Catatan harian</CardTitle>
                  <CardDescription>Satu halaman dari log.</CardDescription>
                </CardHeader>
                <CardContent className="min-w-0">
                  <DataTableFrame>
                    <PondDayEditProvider
                      onSave={async (day, patch) => {
                        if (day.date == null) return
                        await onUpsertDay({
                          batchPondId: cycle.id,
                          date: day.date,
                          averageWeightGrams: day.averageWeightGrams,
                          frMin: day.frMin,
                          frMax: day.frMax,
                          deaths: day.deaths,
                          actualFeedGrams: day.actualFeedGrams,
                          create: false,
                          ...patch,
                        })
                      }}
                    >
                      <table.AppTable>
                        <table.Grid
                          emptyLabel="Belum ada catatan harian."
                          isFetching={daysFetching}
                        />
                        <table.Pagination />
                      </table.AppTable>
                    </PondDayEditProvider>
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
            {tab === 'grafik' ? (
              <TabsContent value="grafik" className="grid min-w-0 gap-4">
                <PondCharts pondCode={cycle.pondCode} points={chartPoints} />
              </TabsContent>
            ) : null}
          </Tabs>
        </div>
      )}

      <AppDialog
        open={recordingDay}
        onOpenChange={setRecordingDay}
        title="Catat harian"
        description={
          cycle
            ? `Catat satu hari untuk kolam ${cycle.pondCode}. DOC diisi otomatis. Tanggal yang sudah ada ditolak.`
            : 'Catat harian.'
        }
      >
        {cycle ? (
          <PondDayForm
            onCancel={() => setRecordingDay(false)}
            onSubmit={async (values) => {
              await onUpsertDay({
                ...values,
                batchPondId: cycle.id,
                create: true,
              })
              setRecordingDay(false)
            }}
          />
        ) : null}
      </AppDialog>

      <AppDialog
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
      </AppDialog>

      <ConfirmDialog
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

      <ConfirmDialog
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

function bibisAmount(item: BibisLine | undefined): string {
  if (!item) return '—'
  if (item.fastingReason === 'dadakan') return 'Puasa dadakan, 0 g'
  if (item.fastingReason === 'pola') return 'Puasa pola, 0 g'
  return `${formatGrams(item.requiredGrams)} g`
}

interface PondFactsProps {
  cycle: KolamCycle
}

const PondFacts: FC<PondFactsProps> = ({ cycle }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Info kolam"
        >
          <Info />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Info kolam</PopoverTitle>
        </PopoverHeader>
        <dl className="grid gap-2 text-sm">
          <Fact label="Asal bibit" value={cycle.seedSource ?? '—'} />
          <Fact label="Jumlah bibit" value={formatGrams(cycle.seedCount)} />
          <Fact label="Volume (m3)" value={formatQuantity(cycle.volumeM3)} />
          <Fact label="Puasa" value={cycle.puasa ?? 'Belum diatur'} />
          <Fact label="Pakan" value={cycle.feedName ?? '—'} />
          <Fact label="Jenis ikan" value={cycle.fishSpeciesName} />
          <Fact label="Metode budidaya" value={cycle.cultivationMethodName} />
        </dl>
      </PopoverContent>
    </Popover>
  )
}

interface FactProps {
  label: string
  value: string
}

const Fact: FC<FactProps> = ({ label, value }) => {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  detail?: string
}

const MetricCard: FC<MetricCardProps> = ({ label, value, detail }) => {
  return (
    <Card>
      <CardHeader className="gap-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {value}
        </CardTitle>
        {detail ? (
          <p className="text-sm text-muted-foreground">{detail}</p>
        ) : null}
      </CardHeader>
    </Card>
  )
}

interface PondChartsProps {
  pondCode: string
  points?: Array<KolamChartPoint>
}

const PondCharts: FC<PondChartsProps> = ({ pondCode, points }) => {
  const form = useAppForm({
    defaultValues: { range: null as DateRange | null },
  })

  return (
    <div className="grid gap-4">
      <form className="max-w-xs">
        <form.AppField name="range">
          {(field) => (
            <field.DateField
              mode="range"
              label="Rentang"
              placeholder="Seluruh siklus"
            />
          )}
        </form.AppField>
      </form>
      <form.Subscribe selector={(state) => state.values.range}>
        {(range) => (
          <ChartSeries pondCode={pondCode} range={range} points={points} />
        )}
      </form.Subscribe>
    </div>
  )
}

interface ChartSeriesProps {
  pondCode: string
  range: DateRange | null
  points?: Array<KolamChartPoint>
}

function rangeDays(range: DateRange | null) {
  if (range?.from == null || range.to == null) return null
  return {
    from: format(range.from, 'yyyy-MM-dd'),
    to: format(range.to, 'yyyy-MM-dd'),
  }
}

const ChartSeries: FC<ChartSeriesProps> = ({ pondCode, range, points }) => {
  const days = rangeDays(range)
  const provided = points != null
  const chart = useQuery({
    ...kolamChartQueryOptions({
      pondCode,
      from: days?.from,
      to: days?.to,
    }),
    enabled: !provided,
  })
  const source = provided
    ? points.filter((point) => {
        if (days == null) return true
        return point.date >= days.from && point.date <= days.to
      })
    : (chart.data?.points ?? [])
  const biomass = source.flatMap((point) =>
    point.biomassGrams == null
      ? []
      : [{ date: point.date, biomassGrams: point.biomassGrams }],
  )
  if (!provided && chart.isPending) {
    return <p className="text-sm text-muted-foreground">Memuat grafik.</p>
  }
  if (!provided && chart.isError) {
    return <p className="text-sm text-destructive">Grafik gagal dimuat.</p>
  }

  const caption =
    days == null
      ? `Seluruh siklus. ${source.length} hari.`
      : `${formatCalendar(days.from)} – ${formatCalendar(days.to)}. ${source.length} hari.`

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">{caption}</p>
      <BiomassChart pondCode={pondCode} points={biomass} />
      <MortalityChart
        pondCode={pondCode}
        points={source.map((point) => ({
          date: point.date,
          deaths: point.deaths,
        }))}
      />
    </div>
  )
}
