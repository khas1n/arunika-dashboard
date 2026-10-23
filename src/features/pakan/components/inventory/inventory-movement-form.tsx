import { useMemo, useRef } from 'react'
import type { FC } from 'react'
import { ZodError } from 'zod'
import { FormError, useAppForm, useFormError } from '#/components/shared/form'
import { Button } from '#/components/ui/button'
import { FieldGroup } from '#/components/ui/field'
import {
  browserTimeZone,
  nowTimeInZone,
  todayInZone,
} from '#/features/pakan/domain/zoned-datetime'
import {
  bibisInputSchema,
  opnameInputSchema,
  receiptInputSchema,
} from '#/features/pakan/schemas/inventory'
import type {
  BibisInput,
  OpnameInput,
  ReceiptInput,
} from '#/features/pakan/schemas/inventory'

interface FeedOption {
  id: string
  name: string
}

interface InventoryMovementFormProps {
  kind: 'receipt' | 'bibis' | 'opname'
  feeds: Array<FeedOption>
  defaultFeedId?: string
  defaultFeedingOn?: string | null
  onSubmitReceipt?: (values: ReceiptInput) => Promise<unknown>
  onSubmitBibis?: (values: BibisInput) => Promise<unknown>
  onSubmitOpname?: (values: OpnameInput) => Promise<unknown>
  onCancel?: () => void
}

export const InventoryMovementForm: FC<InventoryMovementFormProps> = ({
  kind,
  feeds,
  defaultFeedId,
  defaultFeedingOn,
  onSubmitReceipt,
  onSubmitBibis,
  onSubmitOpname,
  onCancel,
}) => {
  const formError = useFormError()
  const requestId = useRef(crypto.randomUUID())
  const timeZone = useMemo(() => browserTimeZone(), [])
  const today = todayInZone(timeZone)
  const feedId =
    defaultFeedId === undefined ? (feeds.at(0)?.id ?? '') : defaultFeedId
  const options = feeds.map((feed) => ({ value: feed.id, label: feed.name }))

  const form = useAppForm({
    defaultValues: {
      feedId,
      quantityGrams: null as number | null,
      physicalQuantityGrams: null as number | null,
      feedingOn: defaultFeedingOn ?? today,
      date: today,
      time: nowTimeInZone(timeZone),
      note: '',
    },
    onSubmit: async ({ value }) => {
      formError.clear()
      try {
        if (kind === 'opname') {
          if (value.physicalQuantityGrams == null) {
            formError.report(new Error('Jumlah fisik wajib diisi'))
            return
          }
        } else if (value.quantityGrams == null) {
          formError.report(new Error('Jumlah wajib diisi'))
          return
        }

        if (kind === 'receipt') {
          await onSubmitReceipt?.(
            receiptInputSchema.parse({
              feedId: value.feedId,
              quantityGrams: value.quantityGrams,
              note: value.note.trim() === '' ? null : value.note.trim(),
              clientRequestId: requestId.current,
              date: value.date,
              time: value.time,
              timeZone,
            }),
          )
        } else if (kind === 'bibis') {
          await onSubmitBibis?.(
            bibisInputSchema.parse({
              feedId: value.feedId,
              feedingOn: value.feedingOn,
              quantityGrams: value.quantityGrams,
              note: value.note.trim() === '' ? null : value.note.trim(),
              clientRequestId: requestId.current,
              date: value.date,
              time: value.time,
              timeZone,
            }),
          )
        } else {
          await onSubmitOpname?.(
            opnameInputSchema.parse({
              feedId: value.feedId,
              physicalQuantityGrams: value.physicalQuantityGrams,
              note: value.note.trim(),
              clientRequestId: requestId.current,
              date: value.date,
              time: value.time,
              timeZone,
            }),
          )
        }
        requestId.current = crypto.randomUUID()
      } catch (error) {
        if (error instanceof ZodError) {
          formError.report(
            new Error(error.issues[0]?.message ?? 'Periksa isian.'),
          )
          return
        }
        formError.report(error)
      }
    },
  })

  const title =
    kind === 'receipt'
      ? 'Tambah'
      : kind === 'bibis'
        ? 'Tambah'
        : 'Catat opname'

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
        <form.AppField name="feedId">
          {(field) => (
            <field.SelectField
              label="Jenis pakan"
              options={options}
              placeholder="Pilih jenis pakan"
            />
          )}
        </form.AppField>
        {kind === 'opname' ? (
          <form.AppField name="physicalQuantityGrams">
            {(field) => (
              <field.NumberField
                label="Jumlah fisik"
                suffix="g"
                emptyValue={null}
                fractionDigits={0}
              />
            )}
          </form.AppField>
        ) : (
          <form.AppField name="quantityGrams">
            {(field) => (
              <field.NumberField
                label="Jumlah"
                suffix="g"
                emptyValue={null}
                fractionDigits={0}
              />
            )}
          </form.AppField>
        )}
        {kind === 'bibis' ? (
          <form.AppField name="feedingOn">
            {(field) => <field.DateField label="Hari pemberian" />}
          </form.AppField>
        ) : null}
        <form.AppField name="date">
          {(field) => <field.DateField label="Tanggal" />}
        </form.AppField>
        <form.AppField name="time">
          {(field) => <field.TimeField label="Waktu" />}
        </form.AppField>
        <form.AppField name="note">
          {(field) => (
            <field.TextareaField
              label={kind === 'opname' ? 'Alasan koreksi' : 'Catatan'}
            />
          )}
        </form.AppField>
      </FieldGroup>
      <div className="flex gap-2">
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" size="sm" loading={isSubmitting}>
              {title}
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
