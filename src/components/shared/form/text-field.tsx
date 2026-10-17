import type { FC } from 'react'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { useFieldContext } from '#/components/shared/form/form-context'
import { toFieldErrors } from '#/lib/form-errors'

interface TextFieldProps {
  label?: string
  description?: string
  type?: 'text' | 'password'
  autoComplete?: string
}

export const TextField: FC<TextFieldProps> = ({
  label,
  description,
  type = 'text',
  autoComplete = 'off',
}) => {
  const field = useFieldContext<string>()
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={invalid || undefined}>
      {label ? <FieldLabel htmlFor={field.name}>{label}</FieldLabel> : null}
      <FieldContent>
        <Input
          id={field.name}
          type={type}
          name={field.name}
          autoComplete={autoComplete}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
          aria-invalid={invalid || undefined}
        />
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
        <FieldError errors={toFieldErrors(field.state.meta.errors)} />
      </FieldContent>
    </Field>
  )
}
