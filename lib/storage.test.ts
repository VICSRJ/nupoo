import { describe, expect, it } from 'vitest'
import { blockContent } from './storage'

describe('blockContent', () => {
  it('creates headings', () => {
    expect(blockContent({ type: 'heading', text: 'Hello', level: 2 })).toMatchObject({
      content: [{ type: 'heading', attrs: { level: 2 } }],
    })
  })

  it('creates task blocks', () => {
    expect(blockContent({ type: 'taskList', text: 'Todo' })).toMatchObject({
      content: [{ type: 'taskList' }],
    })
  })

  it('creates a starter table', () => {
    const result = blockContent({ type: 'table', text: '' })
    expect(result.content?.[0]?.type).toBe('table')
  })

  it('preserves existing rich content', () => {
    const content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rich' }] }] }
    expect(blockContent({ type: 'paragraph', text: 'fallback', content })).toBe(content)
  })
})
