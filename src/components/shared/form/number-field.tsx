import { useMemo } from 'react'
import type { ComponentProps, FC, FocusEvent, FormEvent } from 'react'
import {
  maskitoNumber,
  maskitoParseNumber,
  maskitoStringifyNumber,
} from '@maskito/kit'
import type { MaskitoNumberParams } from '@maskito/kit'
import { useMaskito } from '@maskito/react'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '#/components/ui/input-group'
import { useFieldContext } from '#/components/shared/form/form-context'
import { toFieldErrors } from '#/lib/form-errors'
import { cn } from '#/lib/utils'

const DECIMAL_SEPARATOR = ','
const THOUSAND_SEPARATOR = '.'

interface NumberFieldProps extends ComponentProps<typeof InputGroupInput> {
  label?: string
  ariaLabel?: string
  /** Digits after the decimal comma in the text the operator sees. */
  fractionDigits?: number
  /**
   * Multiply the stored number for display. A feeding rate stored as 0.04
   * is shown as 4 when scale is 100.
   */
  scale?: number
  /** Value written when the field is cleared. Measurements stay null. */
  emptyValue?: number | null
  min?: number
  max?: number
  autoFocus?: boolean
  disabled?: boolean
  className?: string
  /** Cell editor: no label, no error line, height comes from the parent. */
  compact?: boolean
  suffix?: string
  selectOnFocus?: boolean
}

function storedDigits(fractionDigits: number, scale: number) {
  const scaleDigits = scale > 1 ? Math.round(Math.log10(scale)) : 0
  return fractionDigits + scaleDigits
}

function roundTo(value: number, digits: number) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export const NumberField: FC<NumberFieldProps> = ({
  label,
  ariaLabel,
  fractionDigits = 0,
  scale = 1,
  emptyValue = null,
  min = 0,
  max,
  autoFocus = false,
  disabled = false,
  className,
  compact = false,
  suffix,
  selectOnFocus = false,
  ...props
}) => {
  const field = useFieldContext<number | null>()
  const invalid = compact
    ? field.state.meta.errors.length > 0
    : field.state.meta.isTouched && !field.state.meta.isValid
  const digits = storedDigits(fractionDigits, scale)
  const params = useMemo<MaskitoNumberParams>(
    () => ({
      decimalSeparator: DECIMAL_SEPARATOR,
      thousandSeparator: THOUSAND_SEPARATOR,
      decimalPseudoSeparators: [DECIMAL_SEPARATOR],
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits,
      min,
      max,
    }),
    [fractionDigits, min, max],
  )
  const options = useMemo(() => maskitoNumber(params), [params])
  const inputRef = useMaskito({ options })
  const initial = field.state.value
  const defaultValue =
    initial == null ? '' : maskitoStringifyNumber(initial * scale, params)

  const onFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (selectOnFocus) event.currentTarget.select()
  }

  const onInput = (event: FormEvent<HTMLInputElement>) => {
    const text = event.currentTarget.value.trim()
    if (text === '' || text === DECIMAL_SEPARATOR) {
      field.handleChange(emptyValue)
      return
    }
    const parsed = maskitoParseNumber(text, params)
    if (!Number.isFinite(parsed)) return
    field.handleChange(roundTo(parsed / scale, digits))
  }

  const shared = {
    ref: inputRef,
    id: compact ? undefined : field.name,
    name: field.name,
    inputMode: fractionDigits === 0 ? 'numeric' : 'decimal',
    autoComplete: 'off',
    autoFocus,
    disabled,
    defaultValue,
    'aria-label': label ? undefined : ariaLabel,
    'aria-invalid': invalid || undefined,
    onBlur: field.handleBlur,
    onFocus,
    onInput,
    ...props,
  } as const

  const control = suffix ? (
    <InputGroupInput {...shared} className={cn(compact && 'h-full px-2')} />
  ) : (
    <Input
      {...shared}
      className={cn(
        compact &&
          'h-full rounded-none border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 dark:bg-transparent',
        className,
      )}
    />
  )

  const fieldControl = suffix ? (
    <InputGroup
      className={cn(
        compact &&
          'h-full rounded-none border-0 bg-transparent shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0 has-[[data-slot][aria-invalid=true]]:border-0 has-[[data-slot][aria-invalid=true]]:ring-0 dark:bg-transparent dark:has-[[data-slot][aria-invalid=true]]:ring-0',
        className,
      )}
    >
      {control}
      <InputGroupAddon align="inline-end" className={cn(compact && 'pr-2')}>
        <InputGroupText>{suffix}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ) : (
    control
  )

  if (compact) return fieldControl

  return (
    <Field data-invalid={invalid || undefined}>
      {label ? <FieldLabel htmlFor={field.name}>{label}</FieldLabel> : null}
      {fieldControl}
      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
    </Field>
  )
}
