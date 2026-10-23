import type { FC, ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import { InventoryStatus } from '#/features/pakan/components/inventory/inventory-status'
import { InventoryStockMeter } from '#/features/pakan/components/inventory/inventory-stock-meter'
import type { BibisStockStatus } from '#/features/pakan/domain/feed-stock'

export interface InventoryFeedLine {
  id: string
  feedId: string
  name: string
  stockGrams: number
  requiredGrams: number | null
  feedingOn?: string | null
  status?: BibisStockStatus
  figure: 'percent' | 'grams'
}

interface InventoryStockCardProps {
  title?: string
  lines: Array<InventoryFeedLine>
  emptyLabel: string
  note?: string
  isLoading?: boolean
  renderActions: (line: InventoryFeedLine) => ReactNode
}

export const InventoryStockCard: FC<InventoryStockCardProps> = ({
  title,
  lines,
  emptyLabel,
  note,
  isLoading = false,
  renderActions,
}) => {
  return (
    <Card className="min-w-0 gap-4 py-4 shadow-none">
      {title ? (
        <CardHeader className="gap-0">
          <h2 className="text-lg leading-none font-semibold">{title}</h2>
        </CardHeader>
      ) : null}
      <CardContent className="grid gap-2">
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
        {isLoading ? null : lines.length === 0 ? (
          <p>{emptyLabel}</p>
        ) : (
          lines.map((line) => (
            <div
              key={line.id}
              className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2"
            >
              <span className="w-16 shrink-0 font-medium">{line.name}</span>
              <InventoryStockMeter
                requiredGrams={line.requiredGrams}
                stockGrams={line.stockGrams}
                unit={line.figure === 'grams' ? 'stock' : 'left'}
              />
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {line.status ? <InventoryStatus status={line.status} /> : null}
                {renderActions(line)}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
