import { createContext, use, useEffect, useRef, useState } from 'react'
import type { FC, ReactNode } from 'react'
import { Check, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAppForm } from '#/components/shared/form'
import { Spinner } from '#/components/ui/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'
import type { PondDay } from '#/features/pakan/schemas/kolam'

export const pondDayFields = [
  'averageWeightGrams',
  'frMin',
  'frMax',
  'deaths',
  'actualFeedGrams',
] as const

export type PondDayField = (typeof pondDayFields)[number]

type PondDayPatch = Partial<Pick<PondDay, PondDayField>>

interface PendingValue {
  value: number | null
  generation: number
}

type PendingMap = Partial<Record<string, PendingValue>>

interface PondDayEdit {
  editingKey: string | null
  pending: PendingMap
  setEditingKey: (key: string | null) => void
  finish: (currentKey: string, direction: -1 | 0 | 1) => void
  commit: (day: PondDay, field: PondDayField, next: number | null) => void
  clear: (key: string, generation: number) => void
}

const pondDayEdit = createContext<PondDayEdit | null>(null)

const SAVE_FAILED = 'Catatan harian gagal disimpan.'

function cellKey(doc: number, field: PondDayField) {
  return `${doc}:${field}`
}

function withPending(day: PondDay, pending: PendingMap): PondDay {
  const read = (field: PondDayField) => pending[cellKey(day.doc, field)]?.value
  const weight = read('averageWeightGrams')
  const frMin = read('frMin')
  const frMax = read('frMax')
  const deaths = read('deaths')
  const actual = read('actualFeedGrams')
  return {
    ...day,
    averageWeightGrams: weight === undefined ? day.averageWeightGrams : weight,
    frMin: frMin === undefined ? day.frMin : frMin,
    frMax: frMax === undefined ? day.frMax : frMax,
    deaths: deaths === undefined ? day.deaths : (deaths ?? 0),
    actualFeedGrams: actual === undefined ? day.actualFeedGrams : (actual ?? 0),
  }
}

function patchFor(field: PondDayField, next: number | null): PondDayPatch {
  if (field === 'deaths' || field === 'actualFeedGrams') {
    return { [field]: next ?? 0 }
  }
  return { [field]: next }
}

function neighborKey(currentKey: string, direction: -1 | 1) {
  const keys = [
    ...document.querySelectorAll<HTMLElement>('[data-pond-day-cell]'),
  ].map((node) => node.dataset.pondDayCell ?? '')
  const index = keys.indexOf(currentKey)
  if (index < 0) return null
  return keys[index + direction] ?? null
}

export const PondDayEditProvider: FC<{
  onSave: (day: PondDay, patch: PondDayPatch) => Promise<void>
  children: ReactNode
}> = ({ onSave, children }) => {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingMap>({})
  const pendingRef = useRef<PendingMap>({})
  const generationRef = useRef(0)

  const clear = (key: string, generation: number) => {
    setPending((current) => {
      const item = current[key]
      if (!item || item.generation !== generation) return current
      const rest = { ...current }
      delete rest[key]
      pendingRef.current = rest
      return rest
    })
  }

  const finish = (currentKey: string, direction: -1 | 0 | 1) => {
    if (direction === 0) {
      setEditingKey(null)
      return
    }
    setEditingKey(neighborKey(currentKey, direction))
  }

  const commit = (day: PondDay, field: PondDayField, next: number | null) => {
    const key = cellKey(day.doc, field)
    const generation = generationRef.current + 1
    generationRef.current = generation
    const nextPending = {
      ...pendingRef.current,
      [key]: { value: next, generation },
    }
    pendingRef.current = nextPending
    setPending(nextPending)
    void onSave(withPending(day, nextPending), patchFor(field, next)).catch(
      (error: unknown) => {
        setPending((current) => {
          const item = current[key]
          if (!item || item.generation !== generation) return current
          const rest = { ...current }
          delete rest[key]
          pendingRef.current = rest
          return rest
        })
        toast.error(error instanceof Error ? error.message : SAVE_FAILED)
      },
    )
  }

  return (
    <pondDayEdit.Provider
      value={{ editingKey, pending, setEditingKey, finish, commit, clear }}
    >
      {children}
    </pondDayEdit.Provider>
  )
}

interface DayNumberCellProps {
  day: PondDay
  field: PondDayField
  label: string
  format: (value: number | null) => string
  fractionDigits?: number
  scale?: number
  max?: number
  suffix?: string
  emptyValue?: number | null
}

export const DayNumberCell: FC<DayNumberCellProps> = ({
  day,
  field,
  label,
  format,
  fractionDigits = 0,
  scale = 1,
  max,
  suffix,
  emptyValue = null,
}) => {
  const edit = use(pondDayEdit)
  const key = cellKey(day.doc, field)
  const pending = edit?.pending[key]
  useEffect(() => {
    if (!edit || !pending) return
    const current =
      field === 'deaths' || field === 'actualFeedGrams'
        ? (pending.value ?? 0)
        : pending.value
    if (Object.is(day[field], current)) edit.clear(key, pending.generation)
  }, [day, edit, field, key, pending])
  if (!edit || day.date == null) return format(day[field])
  const shown = format(pending ? pending.value : day[field])
  if (edit.editingKey !== key) {
    return (
      <div className="relative -m-2 h-9 w-full">
        <button
          type="button"
          data-pond-day-cell={key}
          className="group absolute inset-0 flex min-w-0 cursor-text items-center px-2 pr-6 text-left hover:bg-secondary"
          aria-label={`Ubah ${label}`}
          onClick={() => edit.setEditingKey(key)}
          onDoubleClick={() => edit.setEditingKey(key)}
        >
          <span className="min-w-0 flex-1 truncate">{shown}</span>
          <Pencil
            data-edit-icon
            className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 opacity-0 group-hover:opacity-100"
          />
        </button>
      </div>
    )
  }

  return (
    <DayNumberEditor
      cellKey={key}
      label={label}
      value={pending ? pending.value : day[field]}
      fractionDigits={fractionDigits}
      scale={scale}
      max={max}
      suffix={suffix}
      emptyValue={emptyValue}
      onCancel={() => edit.setEditingKey(null)}
      onDone={(direction) => edit.finish(key, direction)}
      onCommit={(next) => edit.commit(day, field, next)}
    />
  )
}

interface DayNumberEditorProps {
  cellKey: string
  label: string
  value: number | null
  fractionDigits: number
  scale: number
  max?: number
  suffix?: string
  emptyValue: number | null
  onCancel: () => void
  onDone: (direction: -1 | 0 | 1) => void
  onCommit: (next: number | null) => void
}

function valueSchema(max: number | undefined, scale: number) {
  const limit = max == null || scale === 0 ? null : max / scale
  const number =
    limit == null
      ? z.number().min(0, 'Tidak boleh negatif')
      : z.number().min(0, 'Tidak boleh negatif').max(limit, 'Maksimal 100%')
  return z.object({ value: number.nullable() })
}

const DayNumberEditor: FC<DayNumberEditorProps> = ({
  cellKey: key,
  label,
  value,
  fractionDigits,
  scale,
  max,
  suffix,
  emptyValue,
  onCancel,
  onDone,
  onCommit,
}) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const directionRef = useRef<-1 | 0 | 1>(0)
  const schema = valueSchema(max, scale)
  const form = useAppForm({
    defaultValues: { value },
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: ({ value: submitted }) => {
      const direction = directionRef.current
      if (!Object.is(submitted.value, value)) onCommit(submitted.value)
      onDone(direction)
    },
  })

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node) || !rootRef.current?.contains(target)) {
        onCancel()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onCancel])

  const request = (direction: -1 | 0 | 1) => {
    directionRef.current = direction
    void form.handleSubmit()
  }

  return (
    <div ref={rootRef} className="relative -m-2 h-9 w-full">
      <form.Subscribe selector={(state) => state.isValid}>
        {(isValid) => (
          <form
            data-pond-day-cell={key}
            data-editing=""
            className={cn(
              'absolute inset-0 flex overflow-hidden ring-1 ring-inset',
              isValid ? 'ring-ring' : 'ring-destructive',
            )}
            onSubmit={(event) => {
              event.preventDefault()
              request(0)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                onCancel()
                return
              }
              if (event.key !== 'Tab') return
              event.preventDefault()
              request(event.shiftKey ? -1 : 1)
            }}
          >
            <form.AppField name="value">
              {(field) => (
                <field.NumberField
                  ariaLabel={label}
                  autoFocus
                  selectOnFocus
                  compact
                  className="h-full"
                  fractionDigits={fractionDigits}
                  scale={scale}
                  suffix={suffix}
                  emptyValue={emptyValue}
                />
              )}
            </form.AppField>
          </form>
        )}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <div className="absolute right-0 bottom-full z-20 flex overflow-hidden rounded-t-md">
            <CellAction
              label="Batal"
              icon={X}
              disabled={isSubmitting}
              onClick={onCancel}
            />
            <CellAction
              label="Simpan"
              icon={Check}
              tone="save"
              loading={isSubmitting}
              onClick={() => request(0)}
            />
          </div>
        )}
      </form.Subscribe>
    </div>
  )
}

interface CellActionProps {
  label: string
  icon: typeof Check
  onClick: () => void
  tone?: 'cancel' | 'save'
  disabled?: boolean
  loading?: boolean
}

const CellAction: FC<CellActionProps> = ({
  label,
  icon: Icon,
  onClick,
  tone = 'cancel',
  disabled = false,
  loading = false,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-busy={loading || undefined}
          disabled={disabled || loading}
          className={cn(
            'flex size-6 items-center justify-center rounded-none',
            tone === 'save'
              ? 'bg-success text-success-foreground'
              : 'bg-foreground text-background',
            'disabled:pointer-events-none',
          )}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClick}
        >
          {loading ? (
            <Spinner className="size-3.5" />
          ) : (
            <Icon className="size-3.5" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
