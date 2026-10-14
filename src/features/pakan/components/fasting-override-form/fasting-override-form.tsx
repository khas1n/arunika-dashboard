import type { FC } from 'react'
import { FormError, useAppForm, useFormError } from '#/components/shared/form'
import { Button } from '#/components/ui/button'
import { FieldGroup } from '#/components/ui/field'
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
  const formError = useFormError()
  const form = useAppForm({
    defaultValues: {
      batchPondId,
      startsOn: '',
      endsOn: '',
      reason: '',
      note: '',
    },
    validators: { onSubmit: fastingOverrideInputSchema },
    onSubmit: async ({ value, formApi }) => {
      formError.clear()
      try {
        await onSubmit(fastingOverrideInputSchema.parse(value))
        formApi.reset()
      } catch (error) {
        formError.report(error)
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
      <FormError message={formError.message} />
      <FieldGroup>
        <form.AppField name="startsOn">
          {(field) => <field.TextField label="Hari pertama" type="date" />}
        </form.AppField>
        <form.AppField name="endsOn">
          {(field) => <field.TextField label="Hari terakhir" type="date" />}
        </form.AppField>
        <form.AppField name="reason">
          {(field) => <field.TextField label="Alasan" />}
        </form.AppField>
        <form.AppField name="note">
          {(field) => <field.TextareaField label="Catatan" />}
        </form.AppField>
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
