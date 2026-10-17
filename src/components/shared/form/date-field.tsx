import { useEffect, useMemo, useState } from 'react'
import type { FC } from 'react'
import type { DateRange, Matcher } from '@daypicker/react'
import { format, isSameDay, isValid, parse } from 'date-fns'
import { id as dateLocale } from 'date-fns/locale'
import { CalendarIcon, Check, XIcon } from 'lucide-react'
import { Calendar } from '#/components/ui/calendar'
import { Button } from '#/components/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { useFieldContext } from '#/components/shared/form/form-context'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'
import { toFieldErrors } from '#/lib/form-errors'

type DateFieldMode = 'single' | 'multiple' | 'range'

type DateFieldValue = Date | null | Date[] | DateRange | string

interface DateFieldProps {
  label?: string
  description?: string
  mode?: DateFieldMode
  disabled?: boolean
  /** Days the operator cannot select. A date, a list, a range, or a weekday. */
  disabledDates?: Matcher | Matcher[]
  placeholder?: string
  startMonth?: Date
  endMonth?: Date
}

const placeholders: Record<DateFieldMode, string> = {
  single: 'Pilih tanggal',
  multiple: 'Pilih tanggal',
  range: 'Pilih rentang tanggal',
}

function formatDate(date: Date) {
  return format(date, 'd MMM yyyy', { locale: dateLocale })
}

function parseCalendarDay(value: string) {
  const date = parse(value, 'yyyy-MM-dd', new Date())
  if (!isValid(date) || format(date, 'yyyy-MM-dd') !== value) return null
  return date
}

function formatCalendarDay(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

function singleDate(value: DateFieldValue) {
  if (value instanceof Date) return value
  if (typeof value === 'string') return parseCalendarDay(value)
  return null
}

function isRange(value: DateFieldValue): value is DateRange {
  return (
    value != null &&
    typeof value === 'object' &&
    !(value instanceof Date) &&
    !Array.isArray(value)
  )
}

function rangeStarted(
  value: DateFieldValue,
): value is DateRange & { from: Date } {
  return isRange(value) && value.from != null
}

function rangeDraftLabel(value: DateRange | null) {
  if (!rangeStarted(value)) return 'Pilih tanggal mulai'
  if (value.to == null || isSameDay(value.from, value.to)) {
    return `${formatDate(value.from)} – …`
  }
  return `${formatDate(value.from)} – ${formatDate(value.to)}`
}

function rangesMatch(current: DateFieldValue, draft: DateRange) {
  if (!isRange(current) || current.from == null || draft.from == null)
    return false
  if (!isSameDay(current.from, draft.from)) return false
  if (current.to == null || draft.to == null)
    return current.to == null && draft.to == null
  return isSameDay(current.to, draft.to)
}

function datesMatch(current: DateFieldValue, draft: Date[]) {
  const dates = Array.isArray(current) ? current : []
  if (dates.length !== draft.length) return false
  const byTime = (left: Date, right: Date) => left.getTime() - right.getTime()
  const left = [...dates].sort(byTime)
  const right = [...draft].sort(byTime)
  return left.every((date, index) => isSameDay(date, right[index]))
}

function selectionLabel(mode: DateFieldMode, value: DateFieldValue) {
  if (mode === 'multiple') {
    const dates = Array.isArray(value) ? value : []
    if (dates.length === 0) return null
    if (dates.length === 1) return formatDate(dates[0])
    if (dates.length === 2) {
      return `${formatDate(dates[0])}, ${formatDate(dates[1])}`
    }
    return `${formatDate(dates[0])}, ${formatDate(dates[1])} +${dates.length - 2}`
  }
  if (mode === 'range') {
    if (!isRange(value) || value.from == null) return null
    if (value.to == null || isSameDay(value.from, value.to)) {
      return formatDate(value.from)
    }
    return `${formatDate(value.from)} – ${formatDate(value.to)}`
  }
  const date = singleDate(value)
  return date ? formatDate(date) : null
}

type ConfirmMode = Exclude<DateFieldMode, 'single'>
type ConfirmDraft = Date[] | DateRange | null

function isConfirmMode(mode: DateFieldMode): mode is ConfirmMode {
  return mode !== 'single'
}

function draftFromValue(
  mode: ConfirmMode,
  value: DateFieldValue,
): ConfirmDraft {
  if (mode === 'multiple') return Array.isArray(value) ? value : []
  return isRange(value) ? value : null
}

function confirmLabel(mode: ConfirmMode, draft: ConfirmDraft) {
  if (mode === 'multiple') {
    return (
      selectionLabel('multiple', Array.isArray(draft) ? draft : []) ??
      placeholders.multiple
    )
  }
  return rangeDraftLabel(isRange(draft) ? draft : null)
}

function draftReady(
  mode: ConfirmMode,
  draft: ConfirmDraft,
): draft is Date[] | DateRange {
  if (draft == null) return false
  if (mode === 'multiple') return Array.isArray(draft) && draft.length > 0
  return rangeStarted(draft)
}

function draftChosen(mode: ConfirmMode, draft: ConfirmDraft) {
  if (mode === 'multiple') return draftReady(mode, draft)
  return (
    rangeStarted(draft) && draft.to != null && !isSameDay(draft.from, draft.to)
  )
}

function draftMatches(current: DateFieldValue, draft: Date[] | DateRange) {
  if (Array.isArray(draft)) return datesMatch(current, draft)
  return rangesMatch(current, draft)
}

interface ConfirmSelectionProps {
  label: string
  chosen: boolean
  disabled: boolean
  onApply: () => void
}

const ConfirmSelection: FC<ConfirmSelectionProps> = ({
  label,
  chosen,
  disabled,
  onApply,
}) => (
  <div className="flex items-center gap-2 border-t p-2">
    <span
      className={cn(
        'min-w-0 flex-1 truncate text-sm',
        chosen ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      {label}
    </span>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon-sm"
            aria-label="Terapkan"
            disabled={disabled}
            onClick={onApply}
          >
            <Check />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Terapkan</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
)

export const DateField: FC<DateFieldProps> = ({
  label,
  description,
  mode = 'single',
  disabled = false,
  disabledDates,
  placeholder,
  startMonth,
  endMonth,
}) => {
  const field = useFieldContext<DateFieldValue>()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ConfirmDraft>(null)
  const [timeZone, setTimeZone] = useState<string>()
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid
  const text = selectionLabel(mode, field.state.value)
  const empty = text == null
  const bounds = useMemo(() => {
    const year = new Date().getFullYear()
    return {
      start: startMonth ?? new Date(year - 10, 0),
      end: endMonth ?? new Date(year + 2, 11),
    }
  }, [endMonth, startMonth])

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  const clear = () => {
    const storedAsDay = typeof field.state.value === 'string'
    field.handleChange(mode === 'multiple' ? [] : storedAsDay ? '' : null)
    setOpen(false)
  }

  const applyDraft = () => {
    if (!isConfirmMode(mode) || !draftReady(mode, draft)) return
    if (!draftMatches(field.state.value, draft)) field.handleChange(draft)
    setOpen(false)
  }

  const calendar = (
    <DateFieldCalendar
      mode={mode}
      value={
        isConfirmMode(mode)
          ? draft
          : typeof field.state.value === 'string'
            ? parseCalendarDay(field.state.value)
            : field.state.value
      }
      disabledDates={disabledDates}
      timeZone={timeZone}
      startMonth={bounds.start}
      endMonth={bounds.end}
      onChange={(next) => {
        if (!isConfirmMode(mode)) {
          const picked = next instanceof Date ? next : null
          field.handleChange(
            typeof field.state.value === 'string'
              ? picked
                ? formatCalendarDay(picked)
                : ''
              : picked,
          )
          setOpen(false)
          return
        }
        if (next instanceof Date || typeof next === 'string') return
        setDraft(next)
      }}
    />
  )

  return (
    <Field
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      {label ? <FieldLabel htmlFor={field.name}>{label}</FieldLabel> : null}
      <FieldContent>
        <div className="flex gap-2">
          <Popover
            open={open}
            onOpenChange={(next) => {
              if (next && isConfirmMode(mode)) {
                setDraft(draftFromValue(mode, field.state.value))
              }
              setOpen(next)
              if (!next) field.handleBlur()
            }}
          >
            <PopoverTrigger asChild>
              <Button
                id={field.name}
                type="button"
                variant="outline"
                disabled={disabled}
                data-empty={empty || undefined}
                aria-invalid={invalid || undefined}
                className="min-w-0 flex-1 justify-start data-[empty=true]:text-muted-foreground"
              >
                <CalendarIcon data-icon="inline-start" />
                <span className="truncate">
                  {text ?? placeholder ?? placeholders[mode]}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              {calendar}
              {isConfirmMode(mode) ? (
                <ConfirmSelection
                  label={confirmLabel(mode, draft)}
                  chosen={draftChosen(mode, draft)}
                  disabled={!draftReady(mode, draft)}
                  onApply={applyDraft}
                />
              ) : null}
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Hapus tanggal"
            disabled={disabled || empty}
            onClick={clear}
          >
            <XIcon />
          </Button>
        </div>
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
        <FieldError errors={toFieldErrors(field.state.meta.errors)} />
      </FieldContent>
    </Field>
  )
}

interface DateFieldCalendarProps {
  mode: DateFieldMode
  value: DateFieldValue
  disabledDates?: Matcher | Matcher[]
  timeZone?: string
  startMonth: Date
  endMonth: Date
  onChange: (value: DateFieldValue) => void
}

const DateFieldCalendar: FC<DateFieldCalendarProps> = ({
  mode,
  value,
  disabledDates,
  timeZone,
  startMonth,
  endMonth,
  onChange,
}) => {
  const shared = {
    captionLayout: 'dropdown' as const,
    disabled: disabledDates,
    timeZone,
    startMonth,
    endMonth,
    autoFocus: true,
  }

  if (mode === 'multiple') {
    const selected = Array.isArray(value) ? value : []
    return (
      <Calendar
        {...shared}
        mode="multiple"
        selected={selected}
        defaultMonth={selected[0]}
        onSelect={(dates) => onChange(dates ?? [])}
      />
    )
  }

  if (mode === 'range') {
    const selected = isRange(value) ? value : undefined
    return (
      <Calendar
        {...shared}
        mode="range"
        selected={selected}
        defaultMonth={selected?.from}
        onSelect={(range) => onChange(range ?? null)}
      />
    )
  }

  const selected = value instanceof Date ? value : undefined
  return (
    <Calendar
      {...shared}
      mode="single"
      selected={selected}
      defaultMonth={selected}
      onSelect={(date) => onChange(date ?? null)}
    />
  )
}
