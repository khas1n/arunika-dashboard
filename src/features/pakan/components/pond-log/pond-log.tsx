import { useEffect, useRef, useState } from 'react'
import type { FC } from 'react'
import type { DateRange } from '@daypicker/react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  CalendarDays,
  ChartLine,
  ChevronDown,
  Info,
  Plus,
  Syringe,
  UtensilsCrossed,
} from 'lucide-react'
import { AppDialog } from '#/components/shared/app-dialog'
import { FormError, useAppForm, useFormError } from '#/components/shared/form'
import { ConfirmDialog } from '#/components/shared/confirm-dialog'
import {
  DataTableFrame,
  DataTableSelectionBar,
  useAppTable,
} from '#/components/shared/data-table'
import type { ServerTableControls } from '#/components/shared/data-table'
import { Button } from '#/components/ui/button'
import { FieldGroup } from '#/components/ui/field'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
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
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { FastingOverrideForm } from '#/features/pakan/components/fasting-override-form'
import { PondDayForm } from '#/features/pakan/components/pond-day-form'
import {
  TreatmentLogForm,
  TreatmentLogPanel,
} from '#/features/pakan/components/pond-log/treatment-log'
import {
  BiomassChart,
  MortalityChart,
} from '#/features/pakan/components/pond-log/biomass-chart'
import {
  formatCalendar,
  formatFcr,
  formatGrams,
  formatLongCalendar,
  formatQuantity,
} from '#/features/pakan/components/pond-log/format-pond'
import {
  OverrideEndProvider,
  overrideColumns,
} from '#/features/pakan/components/pond-log/override-columns'
import { pondDayColumns } from '#/features/pakan/components/pond-log/pond-day-columns'
import {
  PondDayEditProvider,
  pondDayRowId,
} from '#/features/pakan/components/pond-log/pond-day-cell'
import type {
  BibisLine,
  FastingOverrideInput,
  FastingOverrideItem,
  KolamChartPoint,
  KolamCycle,
  PondDay,
  PondDayDraft,
  PondDayFormValues,
  PondDayLookup,
  PondDaySave,
  PondTab,
  TreatmentLogInput,
  TreatmentLogItem,
  TreatmentLogUpdate,
  TreatmentOption,
} from '#/features/pakan/schemas/kolam'
import { todayInJakarta } from '#/features/pakan/domain/feeding-schedule'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'

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
  treatments?: Array<TreatmentLogItem>
  treatmentsPending?: boolean
  treatmentsFetching?: boolean
  treatmentsFetchingNextPage?: boolean
  treatmentsHasNextPage?: boolean
  onFetchMoreTreatments?: () => void
  treatmentRange?: DateRange | null
  onTreatmentRangeChange?: (range: DateRange | null) => void
  plannedTreatments?: Array<TreatmentOption>
  treatmentOptions?: Array<TreatmentOption>
  onCreateOverride: (values: FastingOverrideInput) => Promise<unknown>
  onRevokeOverride: (id: string) => Promise<unknown>
  onUpsertDay: (values: PondDaySave) => Promise<unknown>
  onDayExists?: (input: PondDayLookup) => Promise<boolean>
  onLoadDay?: (input: PondDayLookup) => Promise<PondDayDraft | null>
  onCreateTreatment?: (values: TreatmentLogInput) => Promise<unknown>
  onUpdateTreatment?: (values: TreatmentLogUpdate) => Promise<unknown>
  onRevokeTreatment?: (id: string) => Promise<unknown>
  tab?: PondTab
  onTabChange?: (tab: PondTab) => void
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
  treatments = [],
  treatmentsPending = false,
  treatmentsFetching = false,
  treatmentsFetchingNextPage = false,
  treatmentsHasNextPage = false,
  onFetchMoreTreatments,
  treatmentRange = null,
  onTreatmentRangeChange,
  plannedTreatments = [],
  treatmentOptions = [],
  onCreateOverride,
  onRevokeOverride,
  onUpsertDay,
  onDayExists,
  onLoadDay,
  onCreateTreatment,
  onUpdateTreatment,
  onRevokeTreatment,
  tab: tabProp,
  onTabChange,
}) => {
  const [uncontrolledTab, setUncontrolledTab] = useState<PondTab>('harian')
  const tab = tabProp ?? uncontrolledTab
  const setTab = (next: string) => {
    if (
      next !== 'harian' &&
      next !== 'puasa' &&
      next !== 'treatment' &&
      next !== 'grafik'
    ) {
      return
    }
    if (onTabChange) onTabChange(next)
    else setUncontrolledTab(next)
  }
  const [recording, setRecording] = useState(false)
  const [report, setReport] = useState<ReportKind | null>(null)
  const [replacing, setReplacing] = useState<PondDayFormValues | null>(null)
  const [replacingPending, setReplacingPending] = useState(false)
  const [ending, setEnding] = useState<FastingOverrideItem>()
  const [endingIds, setEndingIds] = useState<Array<string>>([])
  const [pendingEnd, setPendingEnd] = useState(false)
  const [endError, setEndError] = useState<string>()
  const [recordingTreatment, setRecordingTreatment] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<TreatmentLogItem>()
  const [revokingTreatment, setRevokingTreatment] = useState<TreatmentLogItem>()
  const [pendingRevokeTreatment, setPendingRevokeTreatment] = useState(false)
  const [revokeTreatmentError, setRevokeTreatmentError] = useState<string>()
  const table = useAppTable({
    data: dayTable ? days : [...days].sort(byDateDesc),
    columns: pondDayColumns,
    getRowId: (row) => pondDayRowId(row),
    enableRowSelection: false,
    initialState: {
      columnPinning: { start: ['date'], end: [] },
      pagination: { pageIndex: 0, pageSize: 25 },
      sorting: [{ id: 'date', desc: true }],
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
      {cycle == null ? (
        <>
          <PondHeading />
          <p className="text-sm text-muted-foreground">
            Belum ada data kolam. Jalankan impor BATCH 1.
          </p>
        </>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="min-w-0 gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PondHeading cycle={cycle} />
            <TabsList>
              <TabsTrigger value="harian">
                <CalendarDays />
                Harian
              </TabsTrigger>
              <TabsTrigger value="puasa">
                <UtensilsCrossed />
                Puasa
              </TabsTrigger>
              <TabsTrigger value="treatment">
                <Syringe />
                Treatment
              </TabsTrigger>
              <TabsTrigger value="grafik">
                <ChartLine />
                Grafik
              </TabsTrigger>
            </TabsList>
          </div>
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
          <TodayReminder cycle={cycle} onOpen={(kind) => setReport(kind)} />
          <TabsContent value="harian" className="grid min-w-0 gap-4">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Catatan harian</CardTitle>
                <CardDescription>
                  Berat, kematian, dan pakan aktual untuk setiap hari. Klik sel
                  untuk mengubah. Nol tetap tercatat.
                </CardDescription>
                <CardAction>
                  <ReportMenu
                    cycle={cycle}
                    onSelect={(kind) => setReport(kind)}
                  />
                </CardAction>
              </CardHeader>
              <CardContent className="min-w-0">
                <DataTableFrame>
                  <PondDayEditProvider
                    onSave={async (day, patch) => {
                      if (day.date == null) return
                      const base = {
                        batchPondId: cycle.id,
                        date: day.date,
                        notify: false as const,
                      }
                      if (patch.averageWeightGrams !== undefined) {
                        await onUpsertDay({
                          ...base,
                          kind: 'weight',
                          averageWeightGrams: patch.averageWeightGrams,
                        })
                      }
                      if (patch.deaths !== undefined) {
                        await onUpsertDay({
                          ...base,
                          kind: 'deaths',
                          deaths: patch.deaths,
                        })
                      }
                      if (patch.actualFeedGrams !== undefined) {
                        await onUpsertDay({
                          ...base,
                          kind: 'feed',
                          actualFeedGrams: patch.actualFeedGrams,
                        })
                      }
                    }}
                  >
                    <table.AppTable>
                      <table.Grid
                        emptyLabel="Belum ada catatan harian."
                        isFetching={daysFetching}
                        className="max-h-auto"
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
                  Puasa di luar pola kolam. Catat rentang baru, atau pilih baris
                  yang masih berjalan untuk mengakhiri. Riwayat yang sudah
                  berakhir tetap tersimpan.
                </CardDescription>
                <CardAction>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setRecording(true)}
                  >
                    <Plus data-icon="inline-start" />
                    Catat puasa dadakan
                  </Button>
                </CardAction>
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
          <TabsContent value="treatment" className="grid min-w-0 gap-4">
            <TreatmentLogPanel
              plannedTreatments={plannedTreatments}
              rows={treatments}
              isPending={treatmentsPending}
              isFetching={treatmentsFetching}
              isFetchingNextPage={treatmentsFetchingNextPage}
              hasNextPage={treatmentsHasNextPage}
              onFetchNextPage={() => onFetchMoreTreatments?.()}
              range={treatmentRange}
              onRangeChange={(next) => onTreatmentRangeChange?.(next)}
              onCreate={() => {
                setEditingTreatment(undefined)
                setRecordingTreatment(true)
              }}
              onEdit={(row) => {
                setRecordingTreatment(false)
                setEditingTreatment(row)
              }}
              onRevoke={(row) => {
                setRevokeTreatmentError(undefined)
                setRevokingTreatment(row)
              }}
            />
          </TabsContent>
          {tab === 'grafik' ? (
            <TabsContent value="grafik" className="grid min-w-0 gap-4">
              <PondCharts pondCode={cycle.pondCode} points={chartPoints} />
            </TabsContent>
          ) : null}
        </Tabs>
      )}

      <AppDialog
        open={report === 'day'}
        onOpenChange={(open) => {
          if (!open) setReport(null)
        }}
        title="Tambah catatan harian"
        description="Pilih tanggal. Berat, kematian, dan pakan aktual tanggal itu dimuat. FR dihitung dari berat."
      >
        {cycle ? (
          <PondDayForm
            loadDay={
              onLoadDay
                ? (date) => onLoadDay({ batchPondId: cycle.id, date })
                : undefined
            }
            onCancel={() => setReport(null)}
            onSubmit={async (values) => {
              const onPage = days.some((day) => day.date === values.date)
              const exists =
                onPage ||
                (onDayExists != null &&
                  (await onDayExists({
                    batchPondId: cycle.id,
                    date: values.date,
                  })))
              if (exists) {
                setReport(null)
                setReplacing(values)
                return
              }
              await saveHistoricalDay(onUpsertDay, cycle.id, values)
              setReport(null)
            }}
          />
        ) : null}
      </AppDialog>

      {cycle && report != null && report !== 'day' ? (
        <TodayReportDialog
          key={report}
          cycle={cycle}
          kind={report}
          onOpenChange={(open) => {
            if (!open) setReport(null)
          }}
          onSubmit={async (value) => {
            if (report === 'weight') {
              await onUpsertDay({
                kind: 'weight',
                batchPondId: cycle.id,
                date: todayInJakarta(),
                averageWeightGrams: value,
              })
            } else if (report === 'deaths') {
              await onUpsertDay({
                kind: 'deaths',
                batchPondId: cycle.id,
                date: todayInJakarta(),
                deaths: value,
              })
            } else {
              await onUpsertDay({
                kind: 'feed',
                batchPondId: cycle.id,
                date: todayInJakarta(),
                actualFeedGrams: value,
              })
            }
            setReport(null)
          }}
        />
      ) : null}

      <ConfirmDialog
        open={replacing != null}
        onOpenChange={(open) => {
          if (!open && !replacingPending) setReplacing(null)
        }}
        title="Ganti catatan harian"
        description={
          replacing
            ? `Catatan harian untuk ${formatLongCalendar(replacing.date)}. Jika Anda melanjutkan, data yang tersimpan untuk tanggal tersebut akan diganti dengan data baru. Apakah Anda yakin ingin melanjutkan?`
            : ''
        }
        confirmLabel="Lanjutkan"
        pending={replacingPending}
        onConfirm={() => {
          if (!replacing || !cycle) return
          const values = replacing
          setReplacingPending(true)
          void saveHistoricalDay(onUpsertDay, cycle.id, values)
            .then(() => setReplacing(null))
            .finally(() => setReplacingPending(false))
        }}
      />

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

      <AppDialog
        open={recordingTreatment || editingTreatment != null}
        onOpenChange={(open) => {
          if (!open) {
            setRecordingTreatment(false)
            setEditingTreatment(undefined)
          }
        }}
        title={editingTreatment ? 'Ubah treatment' : 'Catat treatment'}
      >
        {cycle ? (
          <TreatmentLogForm
            key={editingTreatment?.id ?? 'create'}
            batchPondId={cycle.id}
            options={treatmentOptions}
            initial={editingTreatment}
            onCancel={() => {
              setRecordingTreatment(false)
              setEditingTreatment(undefined)
            }}
            onSubmit={async (values) => {
              if (editingTreatment) {
                if (!onUpdateTreatment) return
                await onUpdateTreatment({
                  id: editingTreatment.id,
                  treatmentId: values.treatmentId,
                  quantityGrams: values.quantityGrams,
                  date: values.date,
                  time: values.time,
                  timeZone: values.timeZone,
                })
                setEditingTreatment(undefined)
                return
              }
              if (!onCreateTreatment) return
              await onCreateTreatment(values)
              setRecordingTreatment(false)
            }}
          />
        ) : null}
      </AppDialog>

      <ConfirmDialog
        open={revokingTreatment != null}
        onOpenChange={(open) => {
          if (!open && !pendingRevokeTreatment) {
            setRevokingTreatment(undefined)
            setRevokeTreatmentError(undefined)
          }
        }}
        title="Hapus treatment?"
        description="Dihapus dari daftar."
        confirmLabel="Hapus"
        pending={pendingRevokeTreatment}
        error={revokeTreatmentError}
        onConfirm={() => {
          if (!revokingTreatment || !onRevokeTreatment) return
          setPendingRevokeTreatment(true)
          setRevokeTreatmentError(undefined)
          void onRevokeTreatment(revokingTreatment.id)
            .then(() => setRevokingTreatment(undefined))
            .catch((error: unknown) => {
              setRevokeTreatmentError(
                error instanceof Error
                  ? error.message
                  : 'Terjadi kesalahan. Coba lagi.',
              )
            })
            .finally(() => setPendingRevokeTreatment(false))
        }}
      />
    </section>
  )
}

type TodayKind = 'weight' | 'deaths' | 'feed'
type ReportKind = TodayKind | 'day'

const weightValueSchema = z.number().nonnegative('Tidak boleh negatif')
const countValueSchema = z
  .number()
  .int('Harus bilangan bulat')
  .nonnegative('Tidak boleh negatif')

const todayCopy = {
  weight: {
    add: 'Tambah berat',
    edit: 'Ubah berat',
    description: 'Berat rata-rata hari ini.',
    label: 'Berat (g)',
    name: 'Berat ikan',
    fractionDigits: 3,
    integer: false,
  },
  deaths: {
    add: 'Tambah kematian',
    edit: 'Ubah kematian',
    description: 'Jumlah kematian hari ini.',
    label: 'Kematian',
    name: 'Kematian',
    fractionDigits: 0,
    integer: true,
  },
  feed: {
    add: 'Aktual pakan',
    edit: 'Ubah aktual pakan',
    description: 'Pakan aktual hari ini.',
    label: 'Pakan aktual (g)',
    name: 'Aktual pakan',
    fractionDigits: 0,
    integer: true,
  },
} as const

function isRecorded(cycle: KolamCycle, kind: TodayKind) {
  if (kind === 'weight') return cycle.todayWeightGrams != null
  if (kind === 'deaths') return cycle.todayDeaths != null
  return cycle.todayFeedGrams != null
}

function recordedValue(cycle: KolamCycle, kind: TodayKind) {
  if (kind === 'weight') return cycle.todayWeightGrams
  if (kind === 'deaths') return cycle.todayDeaths
  return cycle.todayFeedGrams
}

function missingReports(cycle: KolamCycle) {
  return (['weight', 'deaths', 'feed'] as const).filter(
    (kind) => !isRecorded(cycle, kind),
  )
}

function byDateDesc(left: PondDay, right: PondDay) {
  if (left.date == null && right.date == null) return left.doc - right.doc
  if (left.date == null) return 1
  if (right.date == null) return -1
  if (left.date === right.date) return left.doc - right.doc
  return left.date < right.date ? 1 : -1
}

function saveHistoricalDay(
  onUpsertDay: (values: PondDaySave) => Promise<unknown>,
  batchPondId: string,
  values: PondDayFormValues,
) {
  return onUpsertDay({
    kind: 'day',
    batchPondId,
    date: values.date,
    averageWeightGrams: values.averageWeightGrams,
    deaths: values.deaths,
    actualFeedGrams: values.actualFeedGrams,
  })
}

interface ReportMenuProps {
  cycle: KolamCycle
  onSelect: (kind: ReportKind) => void
}

const ReportMenu: FC<ReportMenuProps> = ({ cycle, onSelect }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm">
          <Plus data-icon="inline-start" />
          Catat
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Hari ini</DropdownMenuLabel>
        <DropdownMenuGroup>
          {(['weight', 'deaths', 'feed'] as const).map((kind) => (
            <DropdownMenuItem key={kind} onSelect={() => onSelect(kind)}>
              <span className="flex-1">{todayCopy[kind].add}</span>
              {isRecorded(cycle, kind) ? (
                <span className="text-xs text-muted-foreground">
                  Sudah dicatat
                </span>
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onSelect('day')}>
          Tambah catatan harian
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface TodayReminderProps {
  cycle: KolamCycle
  onOpen: (kind: TodayKind) => void
}

const todayKinds = ['weight', 'deaths', 'feed'] as const

function reminderId(pondCode: string, kind: TodayKind) {
  return `today-report:${pondCode}:${todayInJakarta()}:${kind}`
}

const TodayReminder: FC<TodayReminderProps> = ({ cycle, onOpen }) => {
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen
  const [closed, setClosed] = useState<Array<TodayKind>>([])
  const skipDismiss = useRef(new Set<string>())
  const missingKey = missingReports(cycle)
    .filter((kind) => !closed.includes(kind))
    .join(',')

  useEffect(() => {
    const missing = new Set(missingKey === '' ? [] : missingKey.split(','))
    for (const kind of todayKinds) {
      const id = reminderId(cycle.pondCode, kind)
      if (!missing.has(kind)) {
        skipDismiss.current.add(id)
        toast.dismiss(id)
        continue
      }
      skipDismiss.current.delete(id)
      toast.warning(`${todayCopy[kind].name} hari ini belum dicatat.`, {
        id,
        duration: Infinity,
        position: 'bottom-right',
        closeButton: true,
        richColors: true,
        action: {
          label: todayCopy[kind].add,
          onClick: (event) => {
            event.preventDefault()
            onOpenRef.current(kind)
          },
        },
        onDismiss: () => {
          if (skipDismiss.current.has(id)) {
            skipDismiss.current.delete(id)
            return
          }
          setClosed((current) =>
            current.includes(kind) ? current : [...current, kind],
          )
        },
      })
    }
  }, [cycle.pondCode, missingKey])

  useEffect(() => {
    const pondCode = cycle.pondCode
    return () => {
      for (const kind of todayKinds) {
        const id = reminderId(pondCode, kind)
        skipDismiss.current.add(id)
        toast.dismiss(id)
      }
    }
  }, [cycle.pondCode])

  return null
}

interface TodayReportDialogProps {
  cycle: KolamCycle
  kind: TodayKind
  onOpenChange: (open: boolean) => void
  onSubmit: (value: number) => Promise<unknown>
}

const TodayReportDialog: FC<TodayReportDialogProps> = ({
  cycle,
  kind,
  onOpenChange,
  onSubmit,
}) => {
  const copy = todayCopy[kind]
  const recorded = isRecorded(cycle, kind)
  return (
    <AppDialog
      open
      onOpenChange={onOpenChange}
      title={recorded ? copy.edit : copy.add}
      description={copy.description}
    >
      <TodayReportForm
        label={copy.label}
        fractionDigits={copy.fractionDigits}
        integer={copy.integer}
        initial={recordedValue(cycle, kind)}
        onCancel={() => onOpenChange(false)}
        onSubmit={onSubmit}
      />
    </AppDialog>
  )
}

interface TodayReportFormProps {
  label: string
  fractionDigits: number
  integer: boolean
  initial: number | null
  onSubmit: (value: number) => Promise<unknown>
  onCancel: () => void
}

const TodayReportForm: FC<TodayReportFormProps> = ({
  label,
  fractionDigits,
  integer,
  initial,
  onSubmit,
  onCancel,
}) => {
  const valueSchema = (
    integer ? countValueSchema : weightValueSchema
  ).nullable()
  const formError = useFormError()
  const form = useAppForm({
    defaultValues: { value: initial },
    validators: {
      onSubmit: z.object({
        value: valueSchema.refine((value) => value != null, 'Wajib diisi'),
      }),
    },
    onSubmit: async ({ value }) => {
      formError.clear()
      if (value.value == null) return
      try {
        await onSubmit(value.value)
      } catch (error) {
        formError.report(error)
      }
    },
  })

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FormError message={formError.message} />
      <FieldGroup className="gap-3">
        <form.AppField name="value">
          {(field) => (
            <field.NumberField label={label} fractionDigits={fractionDigits} />
          )}
        </form.AppField>
      </FieldGroup>
      <div className="flex gap-2">
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" size="sm" loading={isSubmitting}>
              Simpan
            </Button>
          )}
        </form.Subscribe>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
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
      <PopoverTrigger>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Info kolam"
              >
                <Info />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Info kolam</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <PopoverHeader className="mb-3">
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

interface PondHeadingProps {
  cycle?: KolamCycle
}

const PondHeading: FC<PondHeadingProps> = ({ cycle }) => {
  return (
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
        <CardTitle className="text-2xl font-semibold tracking-tight text-destructive">
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
