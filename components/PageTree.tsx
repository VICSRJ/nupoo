'use client'

import { Plus, Star } from 'lucide-react'
import type { Page } from '@/lib/storage'

function childrenOf(pages: Page[], parentId: string | null) {
  return pages
    .filter((page) => (page.parentId ?? null) === parentId && !page.trashedAt)
    .sort((a, b) => a.title.localeCompare(b.title, 'cs-CZ'))
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
  const render = (parentId: string | null, depth = 0): React.ReactNode =>
    childrenOf(pages, parentId).map((page, index, siblings) => {
      const children = childrenOf(pages, page.id)
      const isLast = index === siblings.length - 1
      return (
        <div key={page.id} className="page-tree-node">
          {depth > 0 && (
            <span
              aria-hidden="true"
              className={`page-tree-line page-tree-line-${isLast ? 'last' : 'through'}`}
              style={{ left: `${depth * 12 - 6}px` }}
            />
          )}
          <div
            className={`page-tree-item group ${activeId === page.id ? 'is-active' : ''}`}
            style={{ paddingLeft: `${8 + depth * 12}px` }}
          >
            <button
              onClick={() => onSelect(page.id)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
              aria-current={activeId === page.id ? 'page' : undefined}
            >
              <span className="page-tree-icon" aria-hidden="true">{page.icon || '📄'}</span>
              <span className="min-w-0 flex-1 truncate">{page.title || 'Bez názvu'}</span>
              {page.favorite && <Star size={12} className="shrink-0 fill-current text-zinc-500" />}
            </button>
            <button
              onClick={() => onAddChild(page.id)}
              className="page-tree-action rounded-md p-1 text-zinc-400 opacity-0 transition hover:bg-zinc-200 hover:text-zinc-900 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-white"
              title="Nová podstránka"
              aria-label={`Nová podstránka pro ${page.title || 'Bez názvu'}`}
            >
              <Plus size={13} />
            </button>
            <button
              onClick={() => onFavorite(page.id)}
              className={`page-tree-action rounded-md p-1 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white ${page.favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              title={page.favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
              aria-label={page.favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
            >
              <Star size={12} className={page.favorite ? 'fill-current' : ''} />
            </button>
          </div>
          {children.length > 0 && render(page.id, depth + 1)}
        </div>
      )
    })

  return <div className="page-tree">{render(null)}</div>
}
