import type { FC } from 'react'
import { FormError, useAppForm, useFormError } from '#/components/shared/form'
import { Button } from '#/components/ui/button'
import { FieldGroup } from '#/components/ui/field'
import { pondDayFormSchema } from '#/features/pakan/schemas/kolam'
import type { PondDayFormValues } from '#/features/pakan/schemas/kolam'

interface PondDayFormProps {
  onSubmit: (values: PondDayFormValues) => Promise<unknown>
  onCancel?: () => void
}

export const PondDayForm: FC<PondDayFormProps> = ({ onSubmit, onCancel }) => {
  const formError = useFormError()
  const form = useAppForm({
    defaultValues: {
      date: '',
      averageWeightGrams: null as number | null,
      frMin: null as number | null,
      frMax: null as number | null,
      deaths: 0,
      actualFeedGrams: 0,
    },
    validators: { onSubmit: pondDayFormSchema },
    onSubmit: async ({ value, formApi }) => {
      formError.clear()
      try {
        await onSubmit(pondDayFormSchema.parse(value))
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
      <FieldGroup className="gap-3">
        <form.AppField name="date">
          {(field) => <field.TextField label="Tanggal" type="date" />}
        </form.AppField>
        <form.AppField name="averageWeightGrams">
          {(field) => (
            <field.NumberField label="Berat (g)" fractionDigits={3} />
          )}
        </form.AppField>
        <form.AppField name="frMin">
          {(field) => (
            <field.NumberField
              label="FR min (%)"
              fractionDigits={2}
              scale={100}
              max={100}
            />
          )}
        </form.AppField>
        <form.AppField name="frMax">
          {(field) => (
            <field.NumberField
              label="FR max (%)"
              fractionDigits={2}
              scale={100}
              max={100}
            />
          )}
        </form.AppField>
        <form.AppField name="deaths">
          {(field) => <field.NumberField label="Kematian" emptyValue={0} />}
        </form.AppField>
        <form.AppField name="actualFeedGrams">
          {(field) => (
            <field.NumberField label="Pakan aktual (g)" emptyValue={0} />
          )}
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
