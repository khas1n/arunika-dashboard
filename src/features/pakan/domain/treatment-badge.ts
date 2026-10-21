/**
 * Stable Badge color for a treatment. Known codes/names get fixed colors;
 * anything else hashes into the same palette so chips stay consistent in a session.
 */

export const treatmentBadgeVariants = [
  'info',
  'success',
  'warning',
  'accent',
] as const

export type TreatmentBadgeVariant = (typeof treatmentBadgeVariants)[number]

const byCode = {
  MOLASE: 'warning',
  GOS_STRONG: 'info',
  AQUA_CELL: 'success',
  BASILUS: 'accent',
} as const satisfies Record<string, TreatmentBadgeVariant>

const byName = {
  molase: 'warning',
  'gos strong': 'info',
  'aqua cell': 'success',
  basilus: 'accent',
} as const satisfies Record<string, TreatmentBadgeVariant>

function hashKey(key: string) {
  let hash = 0
  for (let index = 0; index < key.length; index++) {
    hash = (hash + key.charCodeAt(index)) % treatmentBadgeVariants.length
  }
  return hash
}

function lookup(
  table: Record<string, TreatmentBadgeVariant>,
  key: string,
): TreatmentBadgeVariant | undefined {
  if (key === '') return undefined
  return Object.hasOwn(table, key) ? table[key] : undefined
}

export function treatmentBadgeVariant(input: {
  code?: string | null
  name?: string | null
  id?: string | null
}): TreatmentBadgeVariant {
  const code = input.code?.trim().toUpperCase() ?? ''
  const fromCode = lookup(byCode, code)
  if (fromCode) return fromCode

  const name = input.name?.trim().toLowerCase() ?? ''
  const fromName = lookup(byName, name)
  if (fromName) return fromName

  const key = code || name || input.id?.trim() || ''
  if (key === '') return 'info'
  return treatmentBadgeVariants[hashKey(key)] ?? 'info'
}
