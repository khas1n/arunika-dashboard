import type { FC } from 'react'
import { CircleCheck, CircleDashed, TriangleAlert } from 'lucide-react'
import { StatusBadge } from '#/components/ui/badge'
import type { BibisStockStatus } from '#/features/pakan/schemas/inventory'

const label: Record<BibisStockStatus, string> = {
  aman: 'Aman',
  'perlu-tambah': 'Perlu tambah bibis',
  'data-belum-lengkap': 'Data belum lengkap',
}

const variant = {
  aman: 'success',
  'perlu-tambah': 'warning',
  'data-belum-lengkap': 'neutral',
} as const

const icon = {
  aman: CircleCheck,
  'perlu-tambah': TriangleAlert,
  'data-belum-lengkap': CircleDashed,
} as const

export const InventoryStatus: FC<{ status: BibisStockStatus }> = ({
  status,
}) => {
  return (
    <StatusBadge variant={variant[status]} icon={icon[status]} size="sm">
      {label[status]}
    </StatusBadge>
  )
}
