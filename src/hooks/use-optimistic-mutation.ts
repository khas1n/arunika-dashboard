import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'

interface OptimisticContext {
  key: string
  generation: number
  /** `latest` is false when a newer edit of this scope is already in flight. */
  undo: (latest: boolean) => void
}

interface OptimisticMutationOptions<TVars, TData> {
  mutationFn: (vars: TVars) => Promise<TData>
  /** Stable id for this record. Later edits of the same id win. */
  scope: (vars: TVars) => string
  queryKey: QueryKey
  /**
   * Apply the expected result and return a function that undoes only this
   * change when the cache still holds the value this call wrote.
   */
  apply: (vars: TVars) => (latest: boolean) => void
  /** Drop any saved baseline after the newest edit is confirmed. */
  accept?: (vars: TVars) => void
  errorMessage: string
  successMessage?: string | ((vars: TVars) => string | undefined)
  /** When false, the caller reports the failure. Defaults to a toast. */
  toastOnError?: boolean | ((vars: TVars) => boolean)
  invalidate: () => Promise<unknown> | void
}

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : fallback
}

/**
 * Optimistic React Query mutation.
 *
 * The request for one scope waits for the previous request, so an older write
 * cannot land on the server after a newer one. A failed call undoes only its
 * own change, and only when a later edit has not replaced that value. An
 * older success does not invalidate while a newer edit of the same scope is
 * still in flight.
 */
export function useOptimisticMutation<TVars, TData>(
  options: OptimisticMutationOptions<TVars, TData>,
) {
  const queryClient = useQueryClient()
  const generations = useRef(new Map<string, number>())
  const tails = useRef(new Map<string, Promise<unknown>>())

  return useMutation({
    mutationFn: (vars: TVars) => {
      const key = options.scope(vars)
      const previous = tails.current.get(key) ?? Promise.resolve()
      const next = previous.then(
        () => options.mutationFn(vars),
        () => options.mutationFn(vars),
      )
      tails.current.set(
        key,
        next.then(
          () => undefined,
          () => undefined,
        ),
      )
      return next
    },
    onMutate: async (vars): Promise<OptimisticContext> => {
      const key = options.scope(vars)
      const generation = (generations.current.get(key) ?? 0) + 1
      generations.current.set(key, generation)
      await queryClient.cancelQueries({ queryKey: options.queryKey })
      const undo = options.apply(vars)
      return { key, generation, undo }
    },
    onError: (error, vars, context) => {
      if (context) {
        const latest =
          generations.current.get(context.key) === context.generation
        context.undo(latest)
      }
      const report =
        typeof options.toastOnError === 'function'
          ? options.toastOnError(vars)
          : options.toastOnError !== false
      if (report) {
        toast.error(messageFrom(error, options.errorMessage), {
          richColors: true,
        })
      }
    },
    onSuccess: (_data, vars, context) => {
      if (generations.current.get(context.key) !== context.generation) return
      options.accept?.(vars)
      const message =
        typeof options.successMessage === 'function'
          ? options.successMessage(vars)
          : options.successMessage
      if (message) toast.success(message)
    },
    onSettled: (_data, _error, _vars, context) => {
      if (!context) return
      if (generations.current.get(context.key) !== context.generation) return
      return options.invalidate()
    },
  })
}
