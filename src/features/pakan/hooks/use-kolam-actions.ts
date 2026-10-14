import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createFastingOverrideFn,
  revokeFastingOverrideFn,
  upsertPondDayFn,
} from '#/features/pakan/api/kolam.functions'
import { kolamQueryKey } from '#/features/pakan/api/kolam.queries'
import { feedsQueryKey } from '#/features/pakan/api/feed.queries'
import type {
  FastingOverrideInput,
  PondDayWrite,
} from '#/features/pakan/schemas/kolam'

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

  const refreshDay = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [...kolamQueryKey, 'days'] }),
      queryClient.invalidateQueries({ queryKey: [...kolamQueryKey, 'bibis'] }),
      queryClient.invalidateQueries({
        queryKey: [...kolamQueryKey, 'biomass'],
      }),
      queryClient.invalidateQueries({
        queryKey: [...kolamQueryKey, 'header'],
      }),
      queryClient.invalidateQueries({ queryKey: feedsQueryKey }),
    ])

  const upsert = useMutation({
    mutationFn: (values: PondDayWrite) => upsertPondDayFn({ data: values }),
    onSuccess: async () => {
      toast.success('Catatan harian tersimpan.')
      await refreshDay()
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Catatan harian gagal disimpan.',
      )
    },
  })

  return {
    createOverride: create.mutateAsync,
    revokeOverride: revoke.mutateAsync,
    upsertDay: upsert.mutateAsync,
  }
}
