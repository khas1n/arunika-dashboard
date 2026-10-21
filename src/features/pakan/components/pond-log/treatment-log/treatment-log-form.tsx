import { useMemo } from 'react'
import type { FC } from 'react'
import { FormError, useAppForm, useFormError } from '#/components/shared/form'
import { Button } from '#/components/ui/button'
import { FieldGroup } from '#/components/ui/field'
import {
  browserTimeZone,
  formatZonedDate,
  formatZonedTime,
  nowTimeInZone,
  todayInZone,
} from '#/features/pakan/domain/zoned-datetime'
import { treatmentLogInputSchema } from '#/features/pakan/schemas/kolam'
import type {
  TreatmentLogInput,
  TreatmentLogItem,
  TreatmentOption,
} from '#/features/pakan/schemas/kolam'

interface TreatmentLogFormProps {
  batchPondId: string
  options: Array<TreatmentOption>
  initial?: TreatmentLogItem
  onSubmit: (values: TreatmentLogInput) => Promise<unknown>
  onCancel?: () => void
}

export const TreatmentLogForm: FC<TreatmentLogFormProps> = ({
  batchPondId,
  options,
  initial,
  onSubmit,
  onCancel,
}) => {
  const formError = useFormError()
  const timeZone = useMemo(() => browserTimeZone(), [])
  const defaults = useMemo(() => {
    if (initial) {
      const instant = new Date(initial.occurredAt)
      return {
        batchPondId,
        treatmentId: initial.treatmentId,
        quantityGrams: initial.quantityGrams,
        date: formatZonedDate(instant, timeZone),
        time: formatZonedTime(instant, timeZone),
        timeZone,
      }
    }
    return {
      batchPondId,
      treatmentId: '',
      quantityGrams: null as number | null,
      date: todayInZone(timeZone),
      time: nowTimeInZone(timeZone),
      timeZone,
    }
  }, [batchPondId, initial, timeZone])

  const form = useAppForm({
    defaultValues: defaults,
    validators: { onSubmit: treatmentLogInputSchema },
    onSubmit: async ({ value }) => {
      formError.clear()
      try {
        await onSubmit(treatmentLogInputSchema.parse(value))
      } catch (error) {
        formError.report(error)
      }
    },
  })

  const selectOptions = options.map((option) => ({
    value: option.id,
    label: option.name,
  }))

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
        <form.AppField name="treatmentId">
          {(field) => (
            <field.SelectField
              label="Treatment"
              placeholder="Pilih treatment"
              options={selectOptions}
            />
          )}
        </form.AppField>
        <form.AppField name="quantityGrams">
          {(field) => (
            <field.NumberField label="Jumlah" suffix="g" emptyValue={null} />
          )}
        </form.AppField>
        <form.AppField name="date">
          {(field) => <field.DateField label="Tanggal" />}
        </form.AppField>
        <form.AppField name="time">
          {(field) => <field.TimeField label="Waktu" />}
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
