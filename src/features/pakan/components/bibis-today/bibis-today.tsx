import type { FC } from 'react'
import {
  formatCalendar,
  formatGrams,
} from '#/features/pakan/components/pond-log/format-pond'
import type { BibisLine } from '#/features/pakan/schemas/kolam'

interface BibisTodayProps {
  prepareOn: string
  feedingOn: string
  items: Array<BibisLine>
}

function bibisText(item: BibisLine): string {
  if (item.fastingReason === 'dadakan') return 'Puasa dadakan, 0 g'
  if (item.fastingReason === 'pola') return 'Puasa pola, 0 g'
  return `${formatGrams(item.requiredGrams)} g`
}

export const BibisToday: FC<BibisTodayProps> = ({
  prepareOn,
  feedingOn,
  items,
}) => {
  return (
    <section className="grid gap-3 rounded-md border p-4">
      <div className="grid gap-1">
        <h2 className="text-base font-semibold">Bibis hari ini</h2>
        <p className="text-sm text-muted-foreground">
          Siapkan pada {formatCalendar(prepareOn)} untuk pemberian{' '}
          {formatCalendar(feedingOn)}.
        </p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada kolam.</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li
              key={item.batchPondId}
              className="flex items-baseline gap-3 text-sm"
            >
              <span className="w-8 font-medium">{item.pondCode}</span>
              <span>{bibisText(item)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
