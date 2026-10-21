import type { FC } from 'react'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useFieldContext } from '#/components/shared/form/form-context'
import { toFieldErrors } from '#/lib/form-errors'

export interface SelectFieldOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label?: string
  description?: string
  placeholder?: string
  disabled?: boolean
  options: Array<SelectFieldOption>
}

/** Single-select bound to a string field value. Empty string means none. */
export const SelectField: FC<SelectFieldProps> = ({
  label,
  description,
  placeholder = 'Pilih',
  disabled = false,
  options,
}) => {
  const field = useFieldContext<string>()
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid
  const value = field.state.value === '' ? undefined : field.state.value

  return (
    <Field
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      {label ? <FieldLabel htmlFor={field.name}>{label}</FieldLabel> : null}
      <FieldContent>
        <Select
          value={value}
          disabled={disabled}
          onValueChange={(next) => {
            field.handleChange(next)
          }}
          onOpenChange={(open) => {
            if (!open) field.handleBlur()
          }}
        >
          <SelectTrigger
            id={field.name}
            className="w-full"
            aria-invalid={invalid || undefined}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
        <FieldError errors={toFieldErrors(field.state.meta.errors)} />
      </FieldContent>
    </Field>
  )
}
