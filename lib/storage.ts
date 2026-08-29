export type Block = {
  id: string
  type: 'paragraph' | 'heading' | 'bulletList' | 'orderedList' | 'taskList' | 'blockquote' | 'codeBlock'
  level?: 1 | 2 | 3
  text: string
}

export type Page = {
  id: string
  title: string
  icon?: string
  favorite?: boolean
  parentId?: string | null
  blocks: Block[]
  updatedAt: string
}

const KEY = 'nupoo.pages.v2'

const seed: Page = {
  id: 'welcome',
  title: 'Vítejte v Nupoo',
  icon: '✦',
  parentId: null,
  updatedAt: new Date().toISOString(),
  blocks: [
    { id: 'b1', type: 'heading', level: 1, text: 'Nupoo' },
    { id: 'b2', type: 'paragraph', text: 'Notion-like blokový editor. Začni psát.' },
    { id: 'b3', type: 'paragraph', text: 'Použij + pro nový blok a úchyt pro přesunutí.' },
  ],
}

function isPage(value: unknown): value is Page {
  if (!value || typeof value !== 'object') return false
  const page = value as Partial<Page>
  return typeof page.id === 'string' && typeof page.title === 'string' && Array.isArray(page.blocks) && typeof page.updatedAt === 'string'
}

export function loadPages(): Page[] {
  if (typeof window === 'undefined') return [seed]
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify([seed]))
      return [seed]
    }
    const parsed: unknown = JSON.parse(raw)
    const pages = Array.isArray(parsed) ? parsed.filter(isPage) : []
    return pages.length > 0 ? pages : [seed]
  } catch {
    return [seed]
  }
}

export function savePages(pages: Page[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(pages))
  } catch {
    // Storage can be unavailable or full; the in-memory state remains usable.
  }
}

export function createPage(parentId: string | null = null): Page {
  return {
    id: crypto.randomUUID(),
    title: 'Nová stránka',
    icon: '📄',
    parentId,
    updatedAt: new Date().toISOString(),
    blocks: [{ id: crypto.randomUUID(), type: 'paragraph', text: '' }],
  }
}
