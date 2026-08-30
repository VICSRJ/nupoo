'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, FileText, Plus, Star } from 'lucide-react'
import type { Page } from '@/lib/storage'

function childrenOf(pages: Page[], parentId: string | null) {
  return pages
    .filter((page) => (page.parentId ?? null) === parentId && !page.trashedAt)
    .sort((a, b) => {
      const aTime = a.createdAt ?? a.updatedAt
      const bTime = b.createdAt ?? b.updatedAt
      return aTime.localeCompare(bTime) || a.title.localeCompare(b.title, 'cs-CZ') || a.id.localeCompare(b.id)
    })
}

function parentIdsFor(pages: Page[], activeId: string) {
  const ids = new Set<string>()
  const visited = new Set<string>()
  let page = pages.find((item) => item.id === activeId)

  while (page?.parentId && !visited.has(page.parentId)) {
    visited.add(page.parentId)
    ids.add(page.parentId)
    page = pages.find((item) => item.id === page?.parentId && !item.trashedAt)
  }

  return ids
}

type PageTreeProps = {
  pages: Page[]
  activeId: string
  onSelect: (id: string) => void
  onFavorite: (id: string) => void
  onAddChild: (id: string) => void
}

export default function PageTree({ pages, activeId, onSelect, onFavorite, onAddChild }: PageTreeProps) {
  const autoExpanded = useMemo(() => parentIdsFor(pages, activeId), [pages, activeId])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setExpanded((current) => {
      const next = new Set(current)
      autoExpanded.forEach((id) => next.add(id))
      return next
    })
  }, [autoExpanded])

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderBranch = (parentId: string | null): React.ReactNode =>
    childrenOf(pages, parentId).map((page) => {
      const children = childrenOf(pages, page.id)
      const hasChildren = children.length > 0
      const isExpanded = expanded.has(page.id)
      const isActive = activeId === page.id

      return (
        <div key={page.id} className="relative">
          <PageTreeRow
            page={page}
            isActive={isActive}
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            onToggle={() => toggle(page.id)}
            onSelect={() => onSelect(page.id)}
            onFavorite={() => onFavorite(page.id)}
            onAddChild={() => onAddChild(page.id)}
          />
          {hasChildren && isExpanded && (
            <div className="relative ml-[13px] border-l border-zinc-200 pl-2 dark:border-white/[0.09]">
              {children.map((child) => (
                <div key={child.id} className="relative">
                  <span className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-zinc-200 dark:bg-white/[0.10]" aria-hidden="true" />
                  <div className="pl-2">{renderPage(child)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    })

  const renderPage = (page: Page): React.ReactNode => {
    const children = childrenOf(pages, page.id)
    const hasChildren = children.length > 0
    const isExpanded = expanded.has(page.id)
    const isActive = activeId === page.id

    return (
      <>
        <PageTreeRow
          page={page}
          isActive={isActive}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggle={() => toggle(page.id)}
          onSelect={() => onSelect(page.id)}
          onFavorite={() => onFavorite(page.id)}
          onAddChild={() => onAddChild(page.id)}
        />
        {hasChildren && isExpanded && (
          <div className="relative ml-[13px] border-l border-zinc-200 pl-2 dark:border-white/[0.09]">
            {children.map((child) => (
              <div key={child.id} className="relative">
                <span className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-zinc-200 dark:bg-white/[0.10]" aria-hidden="true" />
                <div className="pl-2">{renderPage(child)}</div>
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  return <nav aria-label="Struktura stránek" className="py-1">{renderBranch(null)}</nav>
}

function PageTreeRow({
  page,
  isActive,
  hasChildren,
  isExpanded,
  onToggle,
  onSelect,
  onFavorite,
  onAddChild,
}: {
  page: Page
  isActive: boolean
  hasChildren: boolean
  isExpanded: boolean
  onToggle: () => void
  onSelect: () => void
  onFavorite: () => void
  onAddChild: () => void
}) {
  return (
    <div className={`group relative flex min-h-9 items-center rounded-lg pr-1 transition-[background-color,box-shadow] duration-150 ${isActive ? 'bg-zinc-800/90 text-white shadow-sm ring-1 ring-white/10 dark:bg-white/[0.09]' : 'text-zinc-300 hover:bg-black/[0.035] dark:hover:bg-white/[0.045]'}`}>
      <div className="grid size-7 shrink-0 place-items-center">
        {hasChildren ? (
          <button type="button" onClick={onToggle} className="grid size-6 place-items-center rounded-md text-zinc-500 transition-transform hover:bg-black/[0.05] hover:text-zinc-800 dark:hover:bg-white/[0.08] dark:hover:text-zinc-200" aria-label={`${isExpanded ? 'Sbalit' : 'Rozbalit'} ${page.title || 'stránku'}`} aria-expanded={isExpanded}>
            <ChevronRight size={13} className={`transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        ) : <span className="size-6" aria-hidden="true" />}
      </div>
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-[13px] leading-5" aria-current={isActive ? 'page' : undefined}>
        <span className="grid size-5 shrink-0 place-items-center" aria-hidden="true"><FileText size={14} strokeWidth={1.7} className={isActive ? 'text-zinc-200' : 'text-zinc-400'} /></span>
        <span className="min-w-0 flex-1 truncate">{page.title || 'Bez názvu'}</span>
        {page.favorite && <Star size={11} className="shrink-0 fill-current text-zinc-400" />}
      </button>
      <div className="flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
        <button type="button" onClick={onAddChild} className="grid size-6 place-items-center rounded-md text-zinc-500 hover:bg-black/[0.05] hover:text-zinc-800 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100" title="Nová podstránka" aria-label={`Nová podstránka pro ${page.title || 'Bez názvu'}`}><Plus size={12} /></button>
        <button type="button" onClick={onFavorite} className="grid size-6 place-items-center rounded-md text-zinc-500 hover:bg-black/[0.05] hover:text-zinc-800 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100" title={page.favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'} aria-label={page.favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}><Star size={11} className={page.favorite ? 'fill-current' : ''} /></button>
      </div>
    </div>
  )
}
