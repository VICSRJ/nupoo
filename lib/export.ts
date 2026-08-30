import type { Page } from './storage'

export type NupooExport = {
  version: 1
  exportedAt: string
  pages: Page[]
  trash: Page[]
}

export function buildExport(pages: Page[], trash: Page[]): NupooExport {
  return { version: 1, exportedAt: new Date().toISOString(), pages, trash }
}

export function downloadExport(pages: Page[], trash: Page[]) {
  if (typeof window === 'undefined') return
  const payload = JSON.stringify(buildExport(pages, trash), null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `nupoo-export-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function parseImport(raw: string): { pages: Page[]; trash: Page[] } | null {
  try {
    const parsed = JSON.parse(raw) as Partial<NupooExport>
    if (parsed.version !== 1 || !Array.isArray(parsed.pages) || !Array.isArray(parsed.trash)) return null
    return { pages: parsed.pages as Page[], trash: parsed.trash as Page[] }
  } catch {
    return null
  }
}
