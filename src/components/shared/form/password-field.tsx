import { useState } from 'react'
import type { FC } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/components/ui/input-group'
import { useFieldContext } from '#/components/shared/form/form-context'
import { toFieldErrors } from '#/lib/form-errors'

interface PasswordFieldProps {
  label: string
  autoComplete?: string
}

export const PasswordField: FC<PasswordFieldProps> = ({
  label,
  autoComplete = 'current-password',
}) => {
  const field = useFieldContext<string>()
  const [visible, setVisible] = useState(false)
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={field.name}
          name={field.name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
          aria-invalid={invalid || undefined}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={
              visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
            }
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
    </Field>
  )
}
