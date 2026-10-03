/**
 * Turns the error values TanStack Form keeps on a field into the
 * `{ message }` shape that `FieldError` renders.
 */
export function toFieldErrors(errors: ReadonlyArray<unknown>) {
  return errors.flatMap((error) => {
    if (typeof error === 'string') return [{ message: error }]
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return [{ message: error.message }]
    }
    return []
  })
}
