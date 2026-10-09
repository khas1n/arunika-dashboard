import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createFastingOverrideFn,
  revokeFastingOverrideFn,
} from '#/features/pakan/api/kolam.functions'
import { kolamQueryKey } from '#/features/pakan/api/kolam.queries'
import type { FastingOverrideInput } from '#/features/pakan/schemas/kolam'

export function useKolamActions() {
  const queryClient = useQueryClient()
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: [...kolamQueryKey, 'overrides'],
      }),
      queryClient.invalidateQueries({ queryKey: [...kolamQueryKey, 'days'] }),
      queryClient.invalidateQueries({ queryKey: [...kolamQueryKey, 'bibis'] }),
    ])

  const create = useMutation({
    mutationFn: (values: FastingOverrideInput) =>
      createFastingOverrideFn({ data: values }),
    onSuccess: refresh,
  })
  const revoke = useMutation({
    mutationFn: (id: string) => revokeFastingOverrideFn({ data: { id } }),
    onSuccess: refresh,
  })

  return {
    createOverride: create.mutateAsync,
    revokeOverride: revoke.mutateAsync,
  }
}
