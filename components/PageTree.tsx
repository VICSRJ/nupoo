'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
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

  const renderPage = (page: Page, depth: number, isLast: boolean): React.ReactNode => {
    const children = childrenOf(pages, page.id)
    const hasChildren = children.length > 0
    const isExpanded = expanded.has(page.id)
    const isActive = activeId === page.id

    return (
      <div key={page.id} className="relative">
        {depth > 0 && (
          <>
            <span
              aria-hidden="true"
              className={`page-tree-rail page-tree-rail-${isLast ? 'last' : 'through'}`}
            />
            <span aria-hidden="true" className="page-tree-elbow" />
          </>
        )}

        <motion.div
          layout="position"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className={`page-tree-item group ${isActive ? 'is-active' : ''}`}
          style={{ marginLeft: depth * 22 }}
        >
          <button
            type="button"
            onClick={() => hasChildren && toggle(page.id)}
            className={`page-tree-chevron ${hasChildren ? '' : 'is-empty'}`}
            aria-label={`${isExpanded ? 'Sbalit' : 'Rozbalit'} ${page.title || 'stránku'}`}
            aria-expanded={hasChildren ? isExpanded : undefined}
          >
            {hasChildren && (
              <motion.span
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="grid place-items-center"
              >
                <ChevronRight size={13} />
              </motion.span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelect(page.id)}
            className="page-tree-label"
            aria-current={isActive ? 'page' : undefined}
          >
            <motion.span
              animate={{ scale: isActive ? 1.03 : 1 }}
              transition={{ type: 'spring', stiffness: 460, damping: 30 }}
              className="page-tree-icon"
              aria-hidden="true"
            >
              <FileText size={14} strokeWidth={1.75} />
            </motion.span>
            <span className="page-tree-title">{page.title || 'Bez názvu'}</span>
            {page.favorite && <Star size={11} className="page-tree-favorite" aria-hidden="true" />}
          </button>

          <div className="page-tree-actions">
            <button
              type="button"
              onClick={() => onAddChild(page.id)}
              className="page-tree-action"
              title="Nová podstránka"
              aria-label={`Nová podstránka pro ${page.title || 'Bez názvu'}`}
            >
              <Plus size={12} />
            </button>
            <button
              type="button"
              onClick={() => onFavorite(page.id)}
              className="page-tree-action"
              title={page.favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
              aria-label={page.favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
            >
              <Star size={11} className={page.favorite ? 'fill-current' : ''} />
            </button>
          </div>
        </motion.div>

        <AnimatePresence initial={false}>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              {children.map((child, index) => renderPage(child, depth + 1, index === children.length - 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const roots = childrenOf(pages, null)

  return (
    <MotionConfig reducedMotion="user">
      <nav aria-label="Struktura stránek" className="page-tree py-1">
        {roots.map((page, index) => renderPage(page, 0, index === roots.length - 1))}
      </nav>
    </MotionConfig>
  )
}
