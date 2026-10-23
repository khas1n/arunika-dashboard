import { describe, expect, it } from 'vitest'
import {
  pakanSearchSchema,
  resolvePakanSearch,
} from '#/features/pakan/schemas/inventory'
import { compactPakanSearch } from '#/features/pakan/hooks/use-pakan-activity-table'

describe('pakan search', () => {
  it('leaves a blank visit off the url and fills it in memory', () => {
    const parsed = pakanSearchSchema.parse({})
    expect(parsed.page).toBeUndefined()
    expect(resolvePakanSearch(parsed)).toEqual({
      page: 0,
      pageSize: 10,
      q: '',
      sort: 'occurredAt',
      desc: true,
      type: 'all',
      feed: '',
    })
  })

  it('keeps a real page and rejects an unknown sort', () => {
    const parsed = pakanSearchSchema.parse({
      page: 2,
      sort: 'nope',
      desc: false,
    })
    expect(parsed.sort).toBeUndefined()
    expect(resolvePakanSearch(parsed)).toMatchObject({
      page: 2,
      sort: 'occurredAt',
      desc: false,
    })
  })

  it('omits defaults from the url', () => {
    expect(
      compactPakanSearch({
        page: 0,
        pageSize: 25,
        q: '781',
        sort: 'occurredAt',
        desc: true,
        type: 'all',
        feed: '',
      }),
    ).toEqual({ pageSize: 25, q: '781' })
  })
})
