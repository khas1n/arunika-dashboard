import { useState } from 'react'
import type { FC } from 'react'
import { AppDialog } from '#/components/shared/app-dialog'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { InventoryActivityTable } from '#/features/pakan/components/inventory/inventory-activity-table'
import { InventoryMovementForm } from '#/features/pakan/components/inventory/inventory-movement-form'
import { InventoryStockCard } from '#/features/pakan/components/inventory/inventory-stock-card'
import type { InventoryFeedLine } from '#/features/pakan/components/inventory/inventory-stock-card'
import type { ServerTableControls } from '#/components/shared/data-table'
import type {
  ActivityRow,
  BibisInput,
  InventoryActivityType,
  InventoryOverview,
  OpnameInput,
  ReceiptInput,
} from '#/features/pakan/schemas/inventory'

type DialogState =
  | { kind: 'receipt'; feedId?: string }
  | { kind: 'bibis'; feedId?: string; feedingOn?: string | null }
  | { kind: 'opname'; feedId?: string }
  | null

interface InventoryPageProps {
  overview: InventoryOverview | null
  activity: Array<ActivityRow>
  activityCount?: number
  activityTable?: ServerTableControls
  activityType: InventoryActivityType | 'all'
  onActivityTypeChange: (type: InventoryActivityType | 'all') => void
  activityFeedId?: string | null
  onActivityFeedIdChange?: (feedId: string | null) => void
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  onRetry?: () => void
  activityLoading?: boolean
  activityFetching?: boolean
  onCreateReceipt: (values: ReceiptInput) => Promise<unknown>
  onCreateBibis: (values: BibisInput) => Promise<unknown>
  onCreateOpname: (values: OpnameInput) => Promise<unknown>
}

export const InventoryPage: FC<InventoryPageProps> = ({
  overview,
  activity,
  activityCount,
  activityTable,
  activityType,
  onActivityTypeChange,
  activityFeedId = null,
  onActivityFeedIdChange,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  activityLoading = false,
  activityFetching = false,
  onCreateReceipt,
  onCreateBibis,
  onCreateOpname,
}) => {
  const [dialog, setDialog] = useState<DialogState>(null)
  const stocks = overview?.stocks ?? []
  const bibis = overview?.bibis ?? []
  const unassigned = overview?.unassignedPonds ?? []
  const feeds = stocks.map((row) => ({ id: row.feedId, name: row.feedName }))
  const pakanLines: Array<InventoryFeedLine> = stocks.map((row) => {
    const forecast = bibis.find((item) => item.feedId === row.feedId)
    return {
      id: row.feedId,
      feedId: row.feedId,
      name: row.feedName,
      stockGrams: row.stockGrams,
      requiredGrams: forecast?.requiredGrams ?? null,
      figure: 'grams',
    }
  })
  const bibisLines: Array<InventoryFeedLine> = bibis.map((row) => ({
    id: `${row.feedId}:${row.feedingOn ?? 'none'}`,
    feedId: row.feedId,
    name: row.feedName,
    stockGrams: row.stockGrams,
    requiredGrams: row.requiredGrams,
    feedingOn: row.feedingOn,
    status: row.status,
    figure: 'percent',
  }))

  const close = () => setDialog(null)

  return (
    <section className="grid min-w-0 gap-6">
      {isError ? (
        <div className="grid gap-2 rounded-md bg-destructive/10 p-4">
          <p className="text-sm">{errorMessage ?? 'Stok gagal dimuat.'}</p>
          {onRetry ? (
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              Coba lagi
            </Button>
          ) : null}
        </div>
      ) : null}

      {isError && overview == null ? null : (
        <>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <InventoryStockCard
              title="Pakan"
              lines={pakanLines}
              emptyLabel="Belum ada jenis pakan."
              isLoading={isLoading}
              renderActions={(line) => (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setDialog({ kind: 'receipt', feedId: line.feedId })
                    }
                  >
                    Tambah
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDialog({ kind: 'opname', feedId: line.feedId })
                    }
                  >
                    Opname
                  </Button>
                </>
              )}
            />
            <InventoryStockCard
              title="Bibis"
              lines={bibisLines}
              emptyLabel="Belum ada bibis."
              note={
                unassigned.length > 0
                  ? `${unassigned.map((pond) => pond.pondCode).join(', ')} belum punya jenis pakan.`
                  : undefined
              }
              isLoading={isLoading}
              renderActions={(line) => (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDialog({
                      kind: 'bibis',
                      feedId: line.feedId,
                      feedingOn: line.feedingOn,
                    })
                  }
                >
                  Tambah
                </Button>
              )}
            />
          </div>
          <Card className="min-w-0 shadow-none">
            <CardContent className="min-w-0">
              <InventoryActivityTable
                rows={activity}
                rowCount={activityCount}
                server={activityTable}
                type={activityType}
                onTypeChange={onActivityTypeChange}
                feeds={feeds.map((feed) => ({
                  value: feed.id,
                  label: feed.name,
                }))}
                feedId={activityFeedId}
                onFeedIdChange={onActivityFeedIdChange}
                isLoading={activityLoading}
                isFetching={activityFetching}
              />
            </CardContent>
          </Card>
        </>
      )}

      <AppDialog
        open={dialog != null}
        onOpenChange={(open) => {
          if (!open) close()
        }}
        title={
          dialog?.kind === 'opname'
            ? 'Opname stok'
            : dialog?.kind === 'bibis'
              ? 'Tambah bibis'
              : 'Tambah'
        }
      >
        {dialog ? (
          <InventoryMovementForm
            key={`${dialog.kind}:${'feedId' in dialog ? (dialog.feedId ?? '') : ''}`}
            kind={dialog.kind}
            feeds={feeds}
            defaultFeedId={'feedId' in dialog ? dialog.feedId : undefined}
            defaultFeedingOn={
              dialog.kind === 'bibis' ? dialog.feedingOn : undefined
            }
            onCancel={close}
            onSubmitReceipt={async (values) => {
              await onCreateReceipt(values)
              close()
            }}
            onSubmitBibis={async (values) => {
              await onCreateBibis(values)
              close()
            }}
            onSubmitOpname={async (values) => {
              await onCreateOpname(values)
              close()
            }}
          />
        ) : null}
      </AppDialog>
    </section>
  )
}
