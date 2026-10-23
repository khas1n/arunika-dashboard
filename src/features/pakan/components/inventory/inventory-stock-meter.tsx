import type { FC } from 'react'
import { Progress } from '#/components/ui/progress'
import { formatGrams } from '#/features/pakan/components/pond-log/format-pond'
import { cn } from '#/lib/utils'

interface InventoryStockMeterProps {
  requiredGrams: number | null
  stockGrams: number
  /** Stock on hand, or the grams still left after the feeding day. */
  unit?: 'stock' | 'left'
}

function remaining(requiredGrams: number | null, stockGrams: number) {
  if (requiredGrams == null) return null
  if (stockGrams <= 0) return requiredGrams > 0 ? 0 : 100
  return Math.max(
    0,
    Math.round(((stockGrams - requiredGrams) / stockGrams) * 100),
  )
}

function leftGrams(requiredGrams: number | null, stockGrams: number) {
  if (requiredGrams == null) return null
  return Math.max(0, stockGrams - requiredGrams)
}

function tone(percent: number) {
  if (percent <= 10) return 'bg-destructive'
  if (percent <= 25) return 'bg-warning'
  return 'bg-info'
}

export const InventoryStockMeter: FC<InventoryStockMeterProps> = ({
  requiredGrams,
  stockGrams,
  unit = 'stock',
}) => {
  const percent = remaining(requiredGrams, stockGrams)
  const grams =
    unit === 'left' ? leftGrams(requiredGrams, stockGrams) : stockGrams
  const low =
    unit === 'left' ? percent != null && percent <= 10 : stockGrams <= 0

  return (
    <div className="flex min-w-56 shrink items-baseline gap-3">
      <p className="flex w-24 shrink-0 items-baseline justify-end gap-1 leading-none tabular-nums">
        <span
          className={cn(
            'text-lg font-semibold leading-none',
            low && 'text-destructive',
          )}
        >
          {grams == null ? '—' : formatGrams(grams)}
        </span>
        {grams == null ? null : (
          <span className="text-sm leading-none font-normal text-muted-foreground">
            g
          </span>
        )}
      </p>
      <Progress
        className={cn(
          'h-2 w-28 min-w-16 shrink self-center',
          percent === 0 && 'bg-destructive/20',
        )}
        value={percent ?? 0}
        indicatorClassName={percent == null ? 'bg-transparent' : tone(percent)}
        aria-label="Sisa stok"
        aria-valuetext={
          percent == null
            ? 'belum ada'
            : `${grams == null ? '—' : formatGrams(grams)} g, ${percent}%`
        }
      />
      <span
        className={cn(
          'w-12 shrink-0 text-right text-sm leading-none font-medium tabular-nums',
          percent != null && percent <= 10 && 'text-destructive',
          percent != null &&
            percent > 10 &&
            percent <= 25 &&
            'text-warning-foreground',
        )}
      >
        {percent == null ? '—' : `${percent}%`}
      </span>
    </div>
  )
}
