'use client'

import { useMemo, useState } from 'react'
import { ChevronRight, Plus, Star } from 'lucide-react'
import type { Page } from '@/lib/storage'

const DEPTH = 22

function childrenOf(pages: Page[], parentId: string | null) {
  return pages
    .filter((page) => (page.parentId ?? null) === parentId && !page.trashedAt)
    .sort((a, b) => {
      const created = (a.createdAt ?? a.updatedAt).localeCompare(b.createdAt ?? b.updatedAt)
      return created || a.title.localeCompare(b.title, 'cs-CZ') || a.id.localeCompare(b.id)
    })
}

export default function PageTree({
  pages,
  activeId,
  onSelect,
  onFavorite,
  onAddChild,
}: {
  pages: Page[]
  activeId: string
  onSelect: (id: string) => void
  onFavorite: (id: string) => void
  onAddChild: (id: string) => void
}) {
  const allParents = useMemo(() => new Set(pages.filter((page) => pages.some((child) => (child.parentId ?? null) === page.id && !child.trashedAt)).map((page) => page.id)), [pages])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(allParents))

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const render = (parentId: string | null, depth = 0): React.ReactNode => {
    const siblings = childrenOf(pages, parentId)
    return siblings.map((page, index) => {
      const children = childrenOf(pages, page.id)
      const hasChildren = children.length > 0
      const isExpanded = expanded.has(page.id)
      const isLast = index === siblings.length - 1

      return (
        <div key={page.id} className="relative">
          {depth > 0 && (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[10px] top-0 w-px bg-zinc-200 dark:bg-zinc-800"
                style={{ bottom: hasChildren ? 0 : '50%' }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[10px] top-1/2 h-px w-3 bg-zinc-200 dark:bg-zinc-800"
              />
            </>
          )}

          <div
            className={`group relative flex min-h-8 items-center rounded-lg pr-1 transition-[background-color,box-shadow,transform] duration-150 ${activeId === page.id ? 'bg-zinc-800/90 text-white shadow-sm ring-1 ring-white/10 dark:bg-white/[0.10]' : 'text-zinc-300 hover:bg-white/[0.055]'}`}
            style={{ marginLeft: depth * DEPTH, paddingLeft: 4 }}
          >
            <button
              type="button"
              onClick={() => hasChildren && toggle(page.id)}
              className={`grid size-6 shrink-0 place-items-center rounded-md text-zinc-500 transition hover:bg-white/[0.07] hover:text-zinc-200 ${hasChildren ? '' : 'invisible'}`}
              aria-label={isExpanded ? `Sbalit ${page.title || 'stránku'}` : `Rozbalit ${page.title || 'stránku'}`}
              aria-expanded={hasChildren ? isExpanded : undefined}
            >
              <ChevronRight size={13} className={`transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onSelect(page.id)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-[13px] leading-5"
              aria-current={activeId === page.id ? 'page' : undefined}
            >
              <span className="grid size-5 shrink-0 place-items-center text-[14px]" aria-hidden="true">{page.icon || '📄'}</span>
              <span className="min-w-0 flex-1 truncate">{page.title || 'Bez názvu'}</span>
              {page.favorite && <Star size={11} className="shrink-0 fill-current text-zinc-400" aria-hidden="true" />}
            </button>

            <div className="flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                onClick={() => onAddChild(page.id)}
                className="grid size-6 place-items-center rounded-md text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-100"
                title="Nová podstránka"
                aria-label={`Nová podstránka pro ${page.title || 'Bez názvu'}`}
              >
                <Plus size={12} />
              </button>
              <button
                type="button"
                onClick={() => onFavorite(page.id)}
                className="grid size-6 place-items-center rounded-md text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-100"
                title={page.favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
                aria-label={page.favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
              >
                <Star size={11} className={page.favorite ? 'fill-current' : ''} />
              </button>
            </div>
          </div>

          {hasChildren && isExpanded && render(page.id, depth + 1)}
          {depth > 0 && isLast && !hasChildren && <span aria-hidden="true" className="pointer-events-none absolute left-[10px] top-1/2 h-px w-3 bg-zinc-200 dark:bg-zinc-800" />}
        </div>
      )
    })
  }

  return <nav aria-label="Struktura stránek" className="py-1">{render(null)}</nav>
}
