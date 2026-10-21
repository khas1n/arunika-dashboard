import type { ChangeEvent, FC } from 'react'
import { Clock } from 'lucide-react'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#/components/ui/input-group'
import { useFieldContext } from '#/components/shared/form/form-context'
import { toFieldErrors } from '#/lib/form-errors'

interface TimeFieldProps {
  label?: string
  description?: string
  disabled?: boolean
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

/** Digits → `HH:mm` as the operator types. Keeps 24-hour wall clock only. */
function maskTime(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function clampTime(value: string): string {
  if (!TIME_RE.test(value)) return value
  const [hour, minute] = value.split(':').map(Number)
  const h = Math.min(23, hour)
  const m = Math.min(59, minute)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** 24-hour `HH:mm` text field. One clock icon; no AM/PM, no native picker. */
export const TimeField: FC<TimeFieldProps> = ({
  label,
  description,
  disabled = false,
}) => {
  const field = useFieldContext<string>()
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    field.handleChange(maskTime(event.target.value))
  }

  const onBlur = () => {
    const next = clampTime(field.state.value)
    if (next !== field.state.value) field.handleChange(next)
    field.handleBlur()
  }

  return (
    <Field
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      {label ? <FieldLabel htmlFor={field.name}>{label}</FieldLabel> : null}
      <FieldContent>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Clock />
          </InputGroupAddon>
          <InputGroupInput
            id={field.name}
            type="text"
            name={field.name}
            inputMode="numeric"
            autoComplete="off"
            placeholder="HH:mm"
            disabled={disabled}
            value={field.state.value}
            onBlur={onBlur}
            onChange={onChange}
            aria-invalid={invalid || undefined}
          />
        </InputGroup>
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
        <FieldError errors={toFieldErrors(field.state.meta.errors)} />
      </FieldContent>
    </Field>
  )
}
