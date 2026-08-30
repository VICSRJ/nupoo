import { describe, expect, it } from 'vitest'
import { dataService } from './data-service'
import type { Page } from './storage'

const page = (overrides: Partial<Page>): Page => ({
  id: 'p1',
  title: 'Nupoo editor',
  icon: '✦',
  parentId: null,
  favorite: false,
  blocks: [{ id: 'b1', type: 'paragraph', text: 'Rich text workspace' }],
  createdAt: '2026-08-30T00:00:00.000Z',
  updatedAt: '2026-08-30T00:01:00.000Z',
  lastOpenedAt: '2026-08-30T00:01:00.000Z',
  trashedAt: null,
  ...overrides,
})

describe('dataService.search', () => {
  it('prioritizes exact title matches', () => {
    const results = dataService.search([
      page({ id: 'a', title: 'Nupoo' }),
      page({ id: 'b', title: 'Nupoo editor' }),
    ], 'Nupoo')

    expect(results.map((item) => item.id)).toEqual(['a', 'b'])
  })

  it('searches page content as well as title', () => {
    const results = dataService.search([
      page({ id: 'content-match', title: 'Workspace', blocks: [{ id: 'b1', type: 'paragraph', text: 'offline first notes' }] }),
    ], 'offline')

    expect(results[0]?.id).toBe('content-match')
  })
})
