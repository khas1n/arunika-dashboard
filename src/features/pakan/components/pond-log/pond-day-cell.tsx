import { createContext, use, useEffect, useRef, useState } from 'react'
import type { FC, ReactNode } from 'react'
import { useAppForm } from '#/components/shared/form'
import type { PondDay } from '#/features/pakan/schemas/kolam'

export type PondDayField =
  'averageWeightGrams' | 'frMin' | 'frMax' | 'deaths' | 'actualFeedGrams'

type PondDayPatch = Partial<Pick<PondDay, PondDayField>>

interface PondDayEdit {
  editingKey: string | null
  setEditingKey: (key: string | null) => void
  onSave: (day: PondDay, patch: PondDayPatch) => Promise<void>
}

const pondDayEdit = createContext<PondDayEdit | null>(null)

export const PondDayEditProvider: FC<{
  onSave: PondDayEdit['onSave']
  children: ReactNode
}> = ({ onSave, children }) => {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  return (
    <pondDayEdit.Provider value={{ editingKey, setEditingKey, onSave }}>
      {children}
    </pondDayEdit.Provider>
  )
}

interface DayNumberCellProps {
  day: PondDay
  field: PondDayField
  label: string
  text: string
  fractionDigits?: number
  scale?: number
  max?: number
  emptyValue?: number | null
}

function patchFor(field: PondDayField, next: number | null): PondDayPatch {
  if (field === 'deaths' || field === 'actualFeedGrams') {
    return { [field]: next ?? 0 }
  }
  return { [field]: next }
}

export const DayNumberCell: FC<DayNumberCellProps> = ({
  day,
  field,
  label,
  text,
  fractionDigits = 0,
  scale = 1,
  max,
  emptyValue = null,
}) => {
  const edit = use(pondDayEdit)
  const key = `${day.doc}:${field}`
  if (!edit || day.date == null || edit.editingKey !== key) {
    if (!edit || day.date == null) return text
    return (
      <button
        type="button"
        className="rounded-sm px-1 text-left hover:bg-secondary"
        aria-label={`Ubah ${label}`}
        onClick={() => edit.setEditingKey(key)}
      >
        {text}
      </button>
    )
  }

  return (
    <DayNumberEditor
      label={label}
      value={day[field]}
      fractionDigits={fractionDigits}
      scale={scale}
      max={max}
      emptyValue={emptyValue}
      onCancel={() => edit.setEditingKey(null)}
      onCommit={async (next) => {
        await edit.onSave(day, patchFor(field, next))
        edit.setEditingKey(null)
      }}
    />
  )
}

interface DayNumberEditorProps {
  label: string
  value: number | null
  fractionDigits: number
  scale: number
  max?: number
  emptyValue: number | null
  onCancel: () => void
  onCommit: (next: number | null) => Promise<void>
}

const DayNumberEditor: FC<DayNumberEditorProps> = ({
  label,
  value,
  fractionDigits,
  scale,
  max,
  emptyValue,
  onCancel,
  onCommit,
}) => {
  const rootRef = useRef<HTMLFormElement>(null)
  const form = useAppForm({
    defaultValues: { value },
    onSubmit: async ({ value: submitted }) => {
      if (Object.is(submitted.value, value)) {
        onCancel()
        return
      }
      await onCommit(submitted.value)
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

  return (
    <form
      ref={rootRef}
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        event.preventDefault()
        event.stopPropagation()
        onCancel()
      }}
    >
      <form.AppField name="value">
        {(field) => (
          <field.NumberField
            ariaLabel={label}
            autoFocus
            className="h-8"
            fractionDigits={fractionDigits}
            scale={scale}
            max={max}
            emptyValue={emptyValue}
          />
        )}
      </form.AppField>
    </form>
  )
}
