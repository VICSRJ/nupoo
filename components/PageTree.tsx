'use client'

import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ChevronRight, FileText, Plus, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Page } from '@/lib/storage'

const INDENT = 22
const SPRING = { type: 'spring' as const, stiffness: 460, damping: 32, mass: 0.7 }

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

type NodeProps = PageTreeProps & {
  page: Page
  depth: number
  isLast: boolean
  expanded: Set<string>
  toggle: (id: string) => void
}

function PageNode({ page, depth, isLast, expanded, toggle, pages, activeId, onSelect, onFavorite, onAddChild }: NodeProps) {
  const children = useMemo(() => childrenOf(pages, page.id), [pages, page.id])
  const hasChildren = children.length > 0
  const isExpanded = expanded.has(page.id)
  const isActive = activeId === page.id

  return (
    <motion.div layout="position" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.16, ease: 'easeOut' }} className="relative">
      <motion.div
        layout="position"
        whileHover={{ x: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 36 }}
        className={`group relative flex min-h-9 items-center rounded-[10px] pr-1 transition-colors duration-150 ${isActive ? 'text-zinc-50' : 'text-zinc-300 hover:text-zinc-100'}`}
        style={{ marginLeft: depth * INDENT }}
      >
        {isActive && (
          <motion.div
            layoutId="nupoo-page-tree-active"
            className="absolute inset-0 rounded-[10px] bg-zinc-800/90 shadow-[inset_1px_1px_0_rgba(255,255,255,0.045),inset_-1px_-1px_0_rgba(0,0,0,0.28),0_2px_10px_rgba(0,0,0,0.15)] dark:bg-white/[0.075]"
            transition={SPRING}
          />
        )}

        <div className="relative z-10 grid size-7 shrink-0 place-items-center">
          <motion.button
            type="button"
            onClick={() => hasChildren && toggle(page.id)}
            disabled={!hasChildren}
            className="grid size-6 place-items-center rounded-md text-zinc-500 transition-colors hover:bg-white/[0.07] hover:text-zinc-200 disabled:opacity-0"
            whileTap={hasChildren ? { scale: 0.86 } : undefined}
            aria-label={`${isExpanded ? 'Sbalit' : 'Rozbalit'} ${page.title || 'stránku'}`}
            aria-expanded={hasChildren ? isExpanded : undefined}
          >
            {hasChildren && (
              <motion.span animate={{ rotate: isExpanded ? 90 : 0 }} transition={SPRING} className="grid place-items-center">
                <ChevronRight size={13} />
              </motion.span>
            )}
          </motion.button>
        </div>

        <motion.button
          type="button"
          onClick={() => onSelect(page.id)}
          whileTap={{ scale: 0.985 }}
          className="relative z-10 flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-[13px] leading-5"
          aria-current={isActive ? 'page' : undefined}
        >
          <motion.span animate={{ scale: isActive ? 1.04 : 1 }} transition={SPRING} className="grid size-5 shrink-0 place-items-center" aria-hidden="true">
            <FileText size={14} strokeWidth={1.75} className={isActive ? 'text-zinc-100' : 'text-zinc-400'} />
          </motion.span>
          <span className="min-w-0 flex-1 truncate">{page.title || 'Bez názvu'}</span>
          {page.favorite && <Star size={11} className="shrink-0 fill-current text-zinc-400" aria-hidden="true" />}
        </motion.button>

        <div className="relative z-10 flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
          <motion.button
            type="button"
            onClick={() => onAddChild(page.id)}
            whileTap={{ scale: 0.84 }}
            className="grid size-6 place-items-center rounded-md text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-100"
            title="Nová podstránka"
            aria-label={`Nová podstránka pro ${page.title || 'Bez názvu'}`}
          >
            <Plus size={12} />
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onFavorite(page.id)}
            whileTap={{ scale: 0.84, rotate: -10 }}
            className="grid size-6 place-items-center rounded-md text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-100"
            title={page.favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
            aria-label={page.favorite ? 'Odebrat z oblíbených' : 'Přidat z oblíbených'}
          >
            <Star size={11} className={page.favorite ? 'fill-current' : ''} />
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden">
            <div className="relative" style={{ marginLeft: depth * INDENT + 10, paddingLeft: 12 }}>
              <span aria-hidden="true" className="pointer-events-none absolute bottom-2 left-0 top-0 w-px bg-zinc-700/30 dark:bg-zinc-700/40" />
              {children.map((child, index) => (
                <div key={child.id} className="relative">
                  <span aria-hidden="true" className="pointer-events-none absolute left-0 top-[18px] h-px w-3 bg-zinc-700/30 dark:bg-zinc-700/40" />
                  <PageNode
                    page={child}
                    pages={pages}
                    depth={0}
                    isLast={index === children.length - 1}
                    activeId={activeId}
                    expanded={expanded}
                    toggle={toggle}
                    onSelect={onSelect}
                    onFavorite={onFavorite}
                    onAddChild={onAddChild}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
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

  const roots = childrenOf(pages, null)

  return (
    <MotionConfig reducedMotion="user">
      <nav aria-label="Struktura stránek" className="page-tree py-1">
        <AnimatePresence initial={false} mode="popLayout">
          {roots.map((page, index) => (
            <PageNode
              key={page.id}
              page={page}
              pages={pages}
              depth={0}
              isLast={index === roots.length - 1}
              activeId={activeId}
              expanded={expanded}
              toggle={toggle}
              onSelect={onSelect}
              onFavorite={onFavorite}
              onAddChild={onAddChild}
            />
          ))}
        </AnimatePresence>
      </nav>
    </MotionConfig>
  )
}
