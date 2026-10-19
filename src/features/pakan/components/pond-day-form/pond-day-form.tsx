import { useEffect, useRef, useState } from 'react'
import type { FC } from 'react'
import { FormError, useAppForm, useFormError } from '#/components/shared/form'
import { Button } from '#/components/ui/button'
import { FieldGroup } from '#/components/ui/field'
import { Spinner } from '#/components/ui/spinner'
import { pondDayFormSchema } from '#/features/pakan/schemas/kolam'
import type {
  PondDayDraft,
  PondDayFormValues,
} from '#/features/pakan/schemas/kolam'

interface PondDayFormProps {
  onSubmit: (values: PondDayFormValues) => Promise<unknown>
  onCancel?: () => void
  /** Saved values for the chosen date. `null` means that date has no row. */
  loadDay?: (date: string) => Promise<PondDayDraft | null>
}

const emptyDraft: PondDayDraft = {
  averageWeightGrams: null,
  deaths: 0,
  actualFeedGrams: 0,
}

export const PondDayForm: FC<PondDayFormProps> = ({
  onSubmit,
  onCancel,
  loadDay,
}) => {
  const formError = useFormError()
  const loadDayRef = useRef(loadDay)
  loadDayRef.current = loadDay
  const [loading, setLoading] = useState(false)
  const [version, setVersion] = useState(0)
  const [recorded, setRecorded] = useState(false)
  const form = useAppForm({
    defaultValues: {
      date: '',
      averageWeightGrams: null as number | null,
      deaths: null as number | null,
      actualFeedGrams: null as number | null,
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
      <form.Subscribe selector={(state) => state.values.date}>
        {(date) => (
          <DateDraft
            date={date}
            form={form}
            formError={formError}
            loadDayRef={loadDayRef}
            onLoading={setLoading}
            onRecorded={setRecorded}
            onVersion={() => setVersion((current) => current + 1)}
          />
        )}
      </form.Subscribe>
      <FieldGroup className="gap-3" aria-busy={loading || undefined}>
        <form.AppField name="date">
          {(field) => <field.DateField label="Tanggal" />}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values.date}>
          {(date) => (
            <>
              {loading ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner />
                  Memuat catatan.
                </p>
              ) : recorded ? null : date !== '' && loadDay != null ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada catatan pada tanggal ini.
                </p>
              ) : null}
              <form.AppField name="averageWeightGrams">
                {(field) => (
                  <field.NumberField
                    key={`weight-${version}`}
                    label="Berat (g)"
                    fractionDigits={3}
                    disabled={date === '' || loading}
                    placeholder="Masukkan berat (g)"
                  />
                )}
              </form.AppField>
              <form.AppField name="deaths">
                {(field) => (
                  <field.NumberField
                    key={`deaths-${version}`}
                    label="Kematian"
                    disabled={date === '' || loading}
                    placeholder="Masukkan kematian"
                  />
                )}
              </form.AppField>
              <form.AppField name="actualFeedGrams">
                {(field) => (
                  <field.NumberField
                    key={`feed-${version}`}
                    label="Pakan aktual (g)"
                    disabled={date === '' || loading}
                    placeholder="Masukkan pakan aktual (g)"
                  />
                )}
              </form.AppField>
            </>
          )}
        </form.Subscribe>
      </FieldGroup>
      <div className="flex gap-2">
        <form.Subscribe
          selector={(state) => [state.values.date, state.isSubmitting] as const}
        >
          {([date, isSubmitting]) => (
            <Button
              type="submit"
              size="sm"
              loading={isSubmitting}
              disabled={date === '' || loading}
            >
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

interface DateDraftProps {
  date: string
  form: {
    setFieldValue: (
      name: 'averageWeightGrams' | 'deaths' | 'actualFeedGrams',
      value: number | null,
    ) => void
  }
  formError: { clear: () => void; report: (error: unknown) => void }
  loadDayRef: { current: PondDayFormProps['loadDay'] }
  onLoading: (loading: boolean) => void
  onRecorded: (recorded: boolean) => void
  onVersion: () => void
}

const DateDraft: FC<DateDraftProps> = ({
  date,
  form,
  formError,
  loadDayRef,
  onLoading,
  onRecorded,
  onVersion,
}) => {
  const formRef = useRef(form)
  const formErrorRef = useRef(formError)
  const onLoadingRef = useRef(onLoading)
  const onRecordedRef = useRef(onRecorded)
  const onVersionRef = useRef(onVersion)
  formRef.current = form
  formErrorRef.current = formError
  onLoadingRef.current = onLoading
  onRecordedRef.current = onRecorded
  onVersionRef.current = onVersion

  useEffect(() => {
    let cancelled = false
    const apply = (draft: {
      averageWeightGrams: number | null
      deaths: number | null
      actualFeedGrams: number | null
    }) => {
      formRef.current.setFieldValue(
        'averageWeightGrams',
        draft.averageWeightGrams,
      )
      formRef.current.setFieldValue('deaths', draft.deaths)
      formRef.current.setFieldValue('actualFeedGrams', draft.actualFeedGrams)
      onVersionRef.current()
    }

    if (date === '') {
      apply({ averageWeightGrams: null, deaths: null, actualFeedGrams: null })
      onRecordedRef.current(false)
      onLoadingRef.current(false)
      return
    }

    const load = loadDayRef.current
    if (load == null) {
      apply(emptyDraft)
      onRecordedRef.current(false)
      onLoadingRef.current(false)
      return
    }

    onLoadingRef.current(true)
    onRecordedRef.current(false)
    formErrorRef.current.clear()
    apply({ averageWeightGrams: null, deaths: null, actualFeedGrams: null })
    void load(date)
      .then((draft) => {
        if (cancelled) return
        apply(draft ?? emptyDraft)
        onRecordedRef.current(draft != null)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        apply(emptyDraft)
        onRecordedRef.current(false)
        formErrorRef.current.report(error)
      })
      .finally(() => {
        if (!cancelled) onLoadingRef.current(false)
      })

    return () => {
      cancelled = true
    }
  }, [date, loadDayRef])

  return null
}
