import { indexedDbAdapter } from './indexeddb'
import { loadPages, savePages, loadTrash, saveTrash, createPage, type Page } from './storage'

export type PageSearchResult = Page & { score: number }

const PAGES_BACKUP_KEY = 'workspace:pages'
const TRASH_BACKUP_KEY = 'workspace:trash'
const encoder = new TextEncoder()
const decoder = new TextDecoder()

async function backup(key: string, value: unknown): Promise<void> {
  await indexedDbAdapter.set(key, encoder.encode(JSON.stringify(value)))
}

async function restore<T>(key: string): Promise<T | null> {
  try {
    const bytes = await indexedDbAdapter.get(key)
    return bytes ? (JSON.parse(decoder.decode(bytes)) as T) : null
  } catch {
    return null
  }
}

export const dataService = {
  load(): Page[] { return loadPages() },
  save(pages: Page[]) {
    savePages(pages)
    void backup(PAGES_BACKUP_KEY, pages).catch(() => undefined)
  },
  loadTrash(): Page[] { return loadTrash() },
  saveTrash(pages: Page[]) {
    saveTrash(pages)
    void backup(TRASH_BACKUP_KEY, pages).catch(() => undefined)
  },
  async loadBackup(): Promise<{ pages: Page[]; trash: Page[] } | null> {
    const [pages, trash] = await Promise.all([
      restore<Page[]>(PAGES_BACKUP_KEY),
      restore<Page[]>(TRASH_BACKUP_KEY),
    ])
    return pages ? { pages, trash: trash ?? [] } : null
  },
  create(parentId: string | null = null): Page { return createPage(parentId) },
  search(pages: Page[], query: string): PageSearchResult[] {
    const q = query.trim().toLocaleLowerCase('cs-CZ')
    if (!q) return []
    return pages
      .map((page) => {
        const title = page.title.toLocaleLowerCase('cs-CZ')
        const body = page.blocks.map((block) => block.text).join(' ').toLocaleLowerCase('cs-CZ')
        let score = 0
        if (title === q) score += 100
        else if (title.startsWith(q)) score += 60
        else if (title.includes(q)) score += 40
        if (body.includes(q)) score += 15
        return { ...page, score }
      })
      .filter((page) => page.score > 0)
      .sort((a, b) => b.score - a.score || b.updatedAt.localeCompare(a.updatedAt))
  },
}
