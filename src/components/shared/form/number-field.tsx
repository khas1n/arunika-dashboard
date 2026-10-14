import { useMemo } from 'react'
import type { FC } from 'react'
import {
  maskitoNumber,
  maskitoParseNumber,
  maskitoStringifyNumber,
} from '@maskito/kit'
import type { MaskitoNumberParams } from '@maskito/kit'
import { useMaskito } from '@maskito/react'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { useFieldContext } from '#/components/shared/form/form-context'
import { toFieldErrors } from '#/lib/form-errors'
import { cn } from '#/lib/utils'

const DECIMAL_SEPARATOR = ','
const THOUSAND_SEPARATOR = '.'

interface NumberFieldProps {
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
}) => {
  const field = useFieldContext<number | null>()
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid
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

  return (
    <Field data-invalid={invalid || undefined}>
      {label ? <FieldLabel htmlFor={field.name}>{label}</FieldLabel> : null}
      <Input
        ref={inputRef}
        id={field.name}
        name={field.name}
        className={cn(className)}
        inputMode={fractionDigits === 0 ? 'numeric' : 'decimal'}
        autoComplete="off"
        autoFocus={autoFocus}
        disabled={disabled}
        defaultValue={defaultValue}
        aria-label={label ? undefined : ariaLabel}
        aria-invalid={invalid || undefined}
        onBlur={field.handleBlur}
        onInput={(event) => {
          const text = event.currentTarget.value.trim()
          if (text === '' || text === DECIMAL_SEPARATOR) {
            field.handleChange(emptyValue)
            return
          }
          const parsed = maskitoParseNumber(text, params)
          if (!Number.isFinite(parsed)) return
          field.handleChange(roundTo(parsed / scale, digits))
        }}
      />
      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
    </Field>
  )
}
