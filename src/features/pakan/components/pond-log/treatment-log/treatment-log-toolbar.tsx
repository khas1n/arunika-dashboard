import { useEffect, useRef } from 'react'
import type { FC } from 'react'
import type { DateRange } from '@daypicker/react'
import { useAppForm } from '#/components/shared/form'

interface TreatmentLogToolbarProps {
  range: DateRange | null
  onRangeChange: (range: DateRange | null) => void
}

function RangeSync({
  value,
  onRangeChange,
}: {
  value: DateRange | null
  onRangeChange: (range: DateRange | null) => void
}) {
  const onChangeRef = useRef(onRangeChange)
  onChangeRef.current = onRangeChange
  const ready = useRef(false)
  useEffect(() => {
    if (!ready.current) {
      ready.current = true
      return
    }
    onChangeRef.current(value)
  }, [value])
  return null
}

export const TreatmentLogToolbar: FC<TreatmentLogToolbarProps> = ({
  range,
  onRangeChange,
}) => {
  const form = useAppForm({
    defaultValues: { range },
  })

  return (
    <form
      className="w-72 shrink-0"
      onSubmit={(event) => {
        event.preventDefault()
      }}
    >
      <form.AppField name="range">
        {(field) => (
          <field.DateField mode="range" placeholder="Semua tanggal" />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.range}>
        {(value) => (
          <RangeSync value={value} onRangeChange={onRangeChange} />
        )}
      </form.Subscribe>
    </form>
  )
}
