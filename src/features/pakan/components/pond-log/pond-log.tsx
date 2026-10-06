import { useState } from 'react'
import type { FC } from 'react'
import {
  DataTableConfirmDialog,
  DataTableDialog,
  DataTableFrame,
  useAppTable,
} from '#/components/shared/data-table'
import { Button } from '#/components/ui/button'
import { BibisToday } from '#/features/pakan/components/bibis-today'
import { FastingOverrideForm } from '#/features/pakan/components/fasting-override-form'
import {
  formatCalendar,
  formatFcr,
  formatGrams,
  formatQuantity,
} from '#/features/pakan/components/pond-log/format-pond'
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
  cycles: Array<KolamCycle>
  selectedId: string | null
  days: Array<PondDay>
  bibis: Array<BibisLine>
  overrides: Array<FastingOverrideItem>
  onSelectCycle: (id: string) => void
  onCreateOverride: (values: FastingOverrideInput) => Promise<unknown>
  onRevokeOverride: (id: string) => Promise<unknown>
}

export const PondLog: FC<PondLogProps> = ({
  prepareOn,
  feedingOn,
  cycles,
  selectedId,
  days,
  bibis,
  overrides,
  onSelectCycle,
  onCreateOverride,
  onRevokeOverride,
}) => {
  const [recording, setRecording] = useState(false)
  const [ending, setEnding] = useState<FastingOverrideItem>()
  const [pendingEnd, setPendingEnd] = useState(false)
  const [endError, setEndError] = useState<string>()
  const selected = cycles.find((cycle) => cycle.id === selectedId) ?? null
  const table = useAppTable({
    data: days,
    columns: pondDayColumns,
    getRowId: (row) => String(row.doc),
  })

  return (
    <section className="grid gap-6">
      <BibisToday prepareOn={prepareOn} feedingOn={feedingOn} items={bibis} />

      {cycles.length === 0 || selected == null ? (
        <p className="text-sm text-muted-foreground">
          Belum ada data kolam. Jalankan impor BATCH 1.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Kolam</span>
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                aria-label="Kolam"
                value={selected.id}
                onChange={(event) => onSelectCycle(event.target.value)}
              >
                {cycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.pondCode}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" size="sm" onClick={() => setRecording(true)}>
              Catat puasa dadakan
            </Button>
          </div>

          <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-3">
            <HeaderFact label="Asal bibit" value={selected.seedSource ?? '—'} />
            <HeaderFact
              label="Jumlah bibit"
              value={formatGrams(selected.seedCount)}
            />
            <HeaderFact
              label="Volume (m3)"
              value={formatQuantity(selected.volumeM3)}
            />
            <HeaderFact
              label="Puasa"
              value={selected.puasa ?? 'Belum diatur'}
            />
            <HeaderFact label="Pakan" value={selected.feedName ?? '—'} />
            <HeaderFact label="FCR" value={formatFcr(selected.fcr)} />
          </div>

          {overrides.length > 0 ? (
            <ul className="grid gap-2">
              {overrides.map((override) => (
                <li
                  key={override.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span>
                    Puasa dadakan {formatCalendar(override.startsOn)} –{' '}
                    {formatCalendar(override.endsOn)}. {override.reason}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEndError(undefined)
                      setEnding(override)
                    }}
                  >
                    Akhiri
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          <DataTableFrame>
            <table.AppTable>
              <table.Grid emptyLabel="Belum ada catatan harian." />
              <table.Pagination />
            </table.AppTable>
          </DataTableFrame>
        </>
      )}

      <DataTableDialog
        open={recording}
        onOpenChange={setRecording}
        title="Puasa dadakan"
        description={
          selected
            ? `Catat puasa dadakan untuk kolam ${selected.pondCode}. Pola puasa tidak berubah.`
            : 'Catat puasa dadakan.'
        }
      >
        {selected ? (
          <FastingOverrideForm
            batchPondId={selected.id}
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
