import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createBibisRecordFn,
  createFeedReceiptFn,
  createStockOpnameFn,
} from '#/features/pakan/api/inventory.functions'
import { inventoryQueryKey } from '#/features/pakan/api/inventory.queries'
import type {
  BibisInput,
  OpnameInput,
  ReceiptInput,
} from '#/features/pakan/schemas/inventory'

export function useInventoryActions() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: inventoryQueryKey })

  const receipt = useMutation({
    mutationFn: (values: ReceiptInput) =>
      createFeedReceiptFn({ data: values }),
    onSuccess: async () => {
      await invalidate()
      toast.success('Pakan ditambahkan.')
    },
  })

  const bibis = useMutation({
    mutationFn: (values: BibisInput) => createBibisRecordFn({ data: values }),
    onSuccess: async () => {
      await invalidate()
      toast.success('Bibis tercatat.')
    },
  })

  const opname = useMutation({
    mutationFn: (values: OpnameInput) => createStockOpnameFn({ data: values }),
    onSuccess: async () => {
      await invalidate()
      toast.success('Opname tercatat.')
    },
  })

  return {
    createReceipt: receipt.mutateAsync,
    createBibis: bibis.mutateAsync,
    createOpname: opname.mutateAsync,
  }
}
