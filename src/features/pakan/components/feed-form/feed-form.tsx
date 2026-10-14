import type { FC } from 'react'
import { FormError, useAppForm, useFormError } from '#/components/shared/form'
import { Button } from '#/components/ui/button'
import { FieldGroup } from '#/components/ui/field'
import { feedInputSchema } from '#/features/pakan/schemas/feed'
import type { FeedInput } from '#/features/pakan/schemas/feed'

interface FeedFormProps {
  defaultName?: string
  submitLabel: string
  onSubmit: (values: FeedInput) => Promise<unknown>
  onCancel?: () => void
}

export const FeedForm: FC<FeedFormProps> = ({
  defaultName = '',
  submitLabel,
  onSubmit,
  onCancel,
}) => {
  const formError = useFormError()
  const form = useAppForm({
    defaultValues: { name: defaultName },
    validators: { onSubmit: feedInputSchema },
    onSubmit: async ({ value, formApi }) => {
      formError.clear()
      try {
        await onSubmit(feedInputSchema.parse(value))
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
        <form.AppField name="name">
          {(field) => (
            <field.TextField label="Nama jenis pakan" autoComplete="off" />
          )}
        </form.AppField>
      </FieldGroup>
      <div className="flex gap-2">
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" size="sm" loading={isSubmitting}>
              {submitLabel}
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
