import { useId, useState } from 'react'
import type { FC } from 'react'
import { useForm } from '@tanstack/react-form'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { toFieldErrors } from '#/lib/form-errors'
import { fastingOverrideInputSchema } from '#/features/pakan/schemas/kolam'
import type { FastingOverrideInput } from '#/features/pakan/schemas/kolam'

interface FastingOverrideFormProps {
  batchPondId: string
  onSubmit: (values: FastingOverrideInput) => Promise<unknown>
  onCancel?: () => void
}

export const FastingOverrideForm: FC<FastingOverrideFormProps> = ({
  batchPondId,
  onSubmit,
  onCancel,
}) => {
  const startsId = useId()
  const endsId = useId()
  const reasonId = useId()
  const noteId = useId()
  const [errorMessage, setErrorMessage] = useState<string>()
  const form = useForm({
    defaultValues: {
      batchPondId,
      startsOn: '',
      endsOn: '',
      reason: '',
      note: '',
    },
    validators: { onSubmit: fastingOverrideInputSchema },
    onSubmit: async ({ value, formApi }) => {
      setErrorMessage(undefined)
      try {
        await onSubmit(fastingOverrideInputSchema.parse(value))
        formApi.reset()
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan. Coba lagi.',
        )
      }
    },
  })

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <form.Field name="startsOn">
          {(field) => {
            const invalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={startsId}>Hari pertama</FieldLabel>
                <Input
                  id={startsId}
                  type="date"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={invalid || undefined}
                />
                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )
          }}
        </form.Field>
        <form.Field name="endsOn">
          {(field) => {
            const invalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={endsId}>Hari terakhir</FieldLabel>
                <Input
                  id={endsId}
                  type="date"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={invalid || undefined}
                />
                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )
          }}
        </form.Field>
        <form.Field name="reason">
          {(field) => {
            const invalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={reasonId}>Alasan</FieldLabel>
                <Input
                  id={reasonId}
                  name={field.name}
                  autoComplete="off"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={invalid || undefined}
                />
                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )
          }}
        </form.Field>
        <form.Field name="note">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={noteId}>Catatan</FieldLabel>
              <Textarea
                id={noteId}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldError errors={toFieldErrors(field.state.meta.errors)} />
            </Field>
          )}
        </form.Field>
      </FieldGroup>
      <div className="flex gap-2">
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" size="sm" loading={isSubmitting}>
              Simpan
            </Button>
          )}
        </form.Subscribe>
        {onCancel ? (
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        ) : null}
      </div>
    </form>
  )
}
