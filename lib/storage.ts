import type { JSONContent } from '@tiptap/core'

export type BlockType = 'paragraph' | 'heading' | 'bulletList' | 'orderedList' | 'taskList' | 'blockquote' | 'codeBlock'

export type Block = {
  id: string
  type: BlockType
  level?: 1 | 2 | 3
  text: string
  content?: JSONContent
}

export type Page = {
  id: string
  title: string
  icon?: string
  favorite?: boolean
  parentId?: string | null
  blocks: Block[]
  createdAt?: string
  updatedAt: string
  lastOpenedAt?: string
  trashedAt?: string | null
}

const KEY = 'nupoo.pages.v3'
const LEGACY_KEY = 'nupoo.pages.v2'
const LEGACY_KEY_V1 = 'nupoo.pages.v1'

const textContent = (text: string): JSONContent[] => (text ? [{ type: 'text', text }] : [])

export function blockContent(block: Pick<Block, 'type' | 'text' | 'content' | 'level'>): JSONContent {
  if (block.content) return block.content
  const text = textContent(block.text)
  if (block.type === 'heading') return { type: 'doc', content: [{ type: 'heading', attrs: { level: block.level || 1 }, content: text }] }
  if (block.type === 'bulletList') return { type: 'doc', content: [{ type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: text }] }] }] }
  if (block.type === 'orderedList') return { type: 'doc', content: [{ type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: text }] }] }] }
  if (block.type === 'taskList') return { type: 'doc', content: [{ type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: text }] }] }] }
  if (block.type === 'blockquote') return { type: 'doc', content: [{ type: 'blockquote', content: [{ type: 'paragraph', content: text }] }] }
  if (block.type === 'codeBlock') return { type: 'doc', content: [{ type: 'codeBlock', content: text }] }
  return { type: 'doc', content: [{ type: 'paragraph', content: text }] }
}

const seed: Page = {
  id: 'welcome',
  title: 'Vítejte v Nupoo',
  icon: '✦',
  parentId: null,
  favorite: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastOpenedAt: new Date().toISOString(),
  trashedAt: null,
  blocks: [
    { id: 'b1', type: 'heading', level: 1, text: 'Nupoo', content: { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Nupoo' }] }] } },
    { id: 'b2', type: 'paragraph', text: 'Notion-like blokový editor. Začni psát.' },
    { id: 'b3', type: 'paragraph', text: 'Použij / pro rychlé příkazy, ⌘Z pro undo a úchyt pro přesunutí.' },
  ],
}

function isJSONContent(value: unknown): value is JSONContent {
  return !!value && typeof value === 'object' && 'type' in value && typeof (value as { type?: unknown }).type === 'string'
}

function normalizeBlock(value: unknown): Block | null {
  if (!value || typeof value !== 'object') return null
  const block = value as Partial<Block>
  if (typeof block.id !== 'string' || typeof block.type !== 'string') return null
  const type = block.type as BlockType
  if (!['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'codeBlock'].includes(type)) return null
  const text = typeof block.text === 'string' ? block.text : ''
  return {
    id: block.id,
    type,
    text,
    level: type === 'heading' && (block.level === 1 || block.level === 2 || block.level === 3) ? block.level : undefined,
    content: isJSONContent(block.content) ? block.content : undefined,
  }
}

function normalizePage(value: unknown): Page | null {
  if (!value || typeof value !== 'object') return null
  const page = value as Partial<Page>
  if (typeof page.id !== 'string' || typeof page.title !== 'string' || !Array.isArray(page.blocks) || typeof page.updatedAt !== 'string') return null
  return {
    id: page.id,
    title: page.title,
    icon: typeof page.icon === 'string' ? page.icon : '📄',
    favorite: Boolean(page.favorite),
    parentId: typeof page.parentId === 'string' ? page.parentId : null,
    blocks: page.blocks.map(normalizeBlock).filter((block): block is Block => !!block),
    createdAt: typeof page.createdAt === 'string' ? page.createdAt : page.updatedAt,
    updatedAt: page.updatedAt,
    lastOpenedAt: typeof page.lastOpenedAt === 'string' ? page.lastOpenedAt : page.updatedAt,
    trashedAt: typeof page.trashedAt === 'string' ? page.trashedAt : null,
  }
}

function parse(raw: string | null): Page[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(normalizePage).filter((page): page is Page => !!page) : []
  } catch {
    return []
  }
}

export function loadPages(): Page[] {
  if (typeof window === 'undefined') return [seed]
  try {
    const current = parse(window.localStorage.getItem(KEY))
    if (current.length > 0) return current
    const source = parse(window.localStorage.getItem(LEGACY_KEY))
    const legacy = source.length > 0 ? source : parse(window.localStorage.getItem(LEGACY_KEY_V1))
    if (legacy.length > 0) {
      window.localStorage.setItem(KEY, JSON.stringify(legacy))
      return legacy
    }
    window.localStorage.setItem(KEY, JSON.stringify([seed]))
    return [seed]
  } catch {
    return [seed]
  }
}

export function savePages(pages: Page[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(pages))
  } catch {
    // Keep the in-memory document usable when storage is unavailable or full.
  }
}

export function createPage(parentId: string | null = null): Page {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: 'Nová stránka',
    icon: '📄',
    parentId,
    favorite: false,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    trashedAt: null,
    blocks: [{ id: crypto.randomUUID(), type: 'paragraph', text: '', content: { type: 'doc', content: [{ type: 'paragraph' }] } }],
  }
}
