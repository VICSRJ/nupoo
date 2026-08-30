import type { JSONContent } from '@tiptap/core'

export type BlockType = 'paragraph' | 'heading' | 'bulletList' | 'orderedList' | 'taskList' | 'blockquote' | 'codeBlock' | 'horizontalRule' | 'table'
export type Block = { id: string; type: BlockType; level?: 1 | 2 | 3; text: string; content?: JSONContent }
export type Page = { id: string; title: string; icon?: string; favorite?: boolean; parentId?: string | null; blocks: Block[]; createdAt?: string; updatedAt: string; lastOpenedAt?: string; trashedAt?: string | null }

const KEY = 'nupoo.pages.v4'
const LEGACY_KEY = 'nupoo.pages.v3'
const LEGACY_KEY_V2 = 'nupoo.pages.v2'
const LEGACY_KEY_V1 = 'nupoo.pages.v1'
const TRASH_KEY = 'nupoo.trash.v1'

const textContent = (text: string): JSONContent[] => (text ? [{ type: 'text', text }] : [])

export function blockContent(block: Pick<Block, 'type' | 'text' | 'content' | 'level'>): JSONContent {
  if (block.content) return block.content
  const text = textContent(block.text)
  if (block.type === 'heading') return { type: 'doc', content: [{ type: 'heading', attrs: { level: block.level || 1 }, content: text }] }
  if (block.type === 'bulletList') return { type: 'doc', content: [{ type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: text }] }] }] }
  if (block.type === 'orderedList') return { type: 'doc', content: [{ type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: text }] }] }] }
  if (block.type === 'taskList') return { type: 'doc', content: [{ type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: text }] }] }] }
  if (block.type === 'blockquote') return { type: 'doc', content: [{ type: 'blockquote', content: [{ type: 'paragraph', content: text }] }] }
  if (block.type === 'codeBlock') return { type: 'doc', content: [{ type: 'codeBlock', attrs: { language: null }, content: text }] }
  if (block.type === 'horizontalRule') return { type: 'doc', content: [{ type: 'horizontalRule' }] }
  if (block.type === 'table') return {
    type: 'doc',
    content: [{ type: 'table', content: [
      { type: 'tableRow', content: [
        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sloupec 1' }] }] },
        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sloupec 2' }] }] },
      ] },
      { type: 'tableRow', content: [
        { type: 'tableCell', content: [{ type: 'paragraph' }] },
        { type: 'tableCell', content: [{ type: 'paragraph' }] },
      ] },
    ] }]
  }
  return { type: 'doc', content: [{ type: 'paragraph', content: text }] }
}

const now = () => new Date().toISOString()
const seed: Page = { id: 'welcome', title: 'Vítejte v Nupoo', icon: '✦', parentId: null, favorite: false, createdAt: now(), updatedAt: now(), lastOpenedAt: now(), trashedAt: null, blocks: [
  { id: 'b1', type: 'heading', level: 1, text: 'Nupoo', content: { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Nupoo' }] }] } },
  { id: 'b2', type: 'paragraph', text: 'Lehký lokální workspace pro rychlé psaní.' },
  { id: 'b3', type: 'paragraph', text: 'Použij / pro bloky, Ctrl/Cmd+B pro tučné písmo a úchyt pro přesun.' },
] }

function isJSONContent(value: unknown): value is JSONContent { return !!value && typeof value === 'object' && 'type' in value && typeof (value as { type?: unknown }).type === 'string' }
function normalizeBlock(value: unknown): Block | null {
  if (!value || typeof value !== 'object') return null
  const block = value as Partial<Block>
  if (typeof block.id !== 'string' || typeof block.type !== 'string') return null
  const type = block.type as BlockType
  if (!['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'codeBlock', 'horizontalRule', 'table'].includes(type)) return null
  const level = type === 'heading' && (block.level === 1 || block.level === 2 || block.level === 3) ? block.level : undefined
  const content = isJSONContent(block.content) ? block.content : undefined
  return { id: block.id, type, text: typeof block.text === 'string' ? block.text : '', ...(level ? { level } : {}), ...(content ? { content } : {}) }
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
function parse(raw: string | null): Page[] { if (!raw) return []; try { const parsed: unknown = JSON.parse(raw); return Array.isArray(parsed) ? parsed.map(normalizePage).filter((page): page is Page => !!page) : [] } catch { return [] } }
function read(key: string): Page[] { try { return parse(window.localStorage.getItem(key)) } catch { return [] } }
function write(key: string, pages: Page[]) { try { window.localStorage.setItem(key, JSON.stringify(pages)) } catch { /* keep app usable in memory */ } }

export function loadPages(): Page[] {
  if (typeof window === 'undefined') return [seed]
  const current = read(KEY); if (current.length) return current
  const legacy = [LEGACY_KEY, LEGACY_KEY_V2, LEGACY_KEY_V1].map(read).find((pages) => pages.length) || []
  if (legacy.length) { write(KEY, legacy); return legacy }
  write(KEY, [seed]); return [seed]
}
export function savePages(pages: Page[]) { if (typeof window !== 'undefined') write(KEY, pages) }
export function loadTrash(): Page[] { if (typeof window === 'undefined') return []; return read(TRASH_KEY) }
export function saveTrash(pages: Page[]) { if (typeof window !== 'undefined') write(TRASH_KEY, pages) }
export function createPage(parentId: string | null = null): Page {
  const timestamp = now()
  return { id: crypto.randomUUID(), title: 'Nová stránka', icon: '📄', parentId, favorite: false, createdAt: timestamp, updatedAt: timestamp, lastOpenedAt: timestamp, trashedAt: null, blocks: [{ id: crypto.randomUUID(), type: 'paragraph', text: '', content: { type: 'doc', content: [{ type: 'paragraph' }] } }] }
}
