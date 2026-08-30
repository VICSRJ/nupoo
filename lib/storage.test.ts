import { describe, expect, it } from 'vitest'
import { blockContent } from './storage'

describe('blockContent', () => {
  it.each([
    ['paragraph', 'paragraph'],
    ['heading', 'heading'],
    ['bulletList', 'bulletList'],
    ['orderedList', 'orderedList'],
    ['taskList', 'taskList'],
    ['blockquote', 'blockquote'],
    ['codeBlock', 'codeBlock'],
    ['horizontalRule', 'horizontalRule'],
    ['table', 'table'],
  ] as const)('creates valid Tiptap content for %s', (type, expected) => {
    const result = blockContent({ type, text: '', ...(type === 'heading' ? { level: 2 as const } : {}) })
    expect(result.type).toBe('doc')
    expect(result.content?.[0]?.type).toBe(expected)
  })

  it('creates headings with the requested level', () => {
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
