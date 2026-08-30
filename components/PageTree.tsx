'use client'

import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ChevronRight, FileText, Plus, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  const seen = new Set<string>()
  let page = pages.find((item) => item.id === activeId)
  while (page?.parentId && !seen.has(page.parentId)) {
    seen.add(page.parentId)
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
      {depth > 0 && (
        <>
          <span aria-hidden className="pointer-events-none absolute left-[-11px] top-0 w-px bg-border/70" style={{ height: isLast ? '18px' : '100%' }} />
          <span aria-hidden className="pointer-events-none absolute left-[-11px] top-1/2 h-px w-3 bg-border/70" />
        </>
      )}

      <motion.div
        layout="position"
        whileHover={{ x: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 36 }}
        className={`group relative flex min-h-9 items-center rounded-lg pr-1 ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-border/70' : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/70'}`}
        style={{ marginLeft: depth * INDENT }}
      >
        <div className="relative z-10 grid size-7 shrink-0 place-items-center">
          <Button variant="ghost" size="icon-sm" disabled={!hasChildren} onClick={() => hasChildren && toggle(page.id)} className="text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-0" aria-label={`${isExpanded ? 'Sbalit' : 'Rozbalit'} ${page.title || 'stránku'}`} aria-expanded={hasChildren ? isExpanded : undefined}>
            <motion.span animate={{ rotate: isExpanded ? 90 : 0 }} transition={SPRING} className="grid place-items-center"><ChevronRight size={13} /></motion.span>
          </Button>
        </div>

        <Button variant="ghost" onClick={() => onSelect(page.id)} className="relative z-10 min-w-0 flex-1 justify-start gap-2 rounded-md px-1.5 py-1.5 text-left text-[13px] font-normal hover:bg-transparent" aria-current={isActive ? 'page' : undefined}>
          <motion.span animate={{ scale: isActive ? 1.04 : 1 }} transition={SPRING} className="grid size-5 shrink-0 place-items-center text-muted-foreground" aria-hidden><FileText size={14} strokeWidth={1.75} /></motion.span>
          <span className="min-w-0 flex-1 truncate">{page.title || 'Bez názvu'}</span>
          {page.favorite && <Star size={11} className="shrink-0 fill-current text-muted-foreground" aria-hidden />}
        </Button>

        <TooltipProvider delayDuration={350}>
          <div className="relative z-10 flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" onClick={() => onAddChild(page.id)} className="text-muted-foreground hover:bg-accent hover:text-accent-foreground" aria-label={`Nová podstránka pro ${page.title || 'Bez názvu'}`}><Plus size={12} /></Button></TooltipTrigger><TooltipContent>Nová podstránka</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" onClick={() => onFavorite(page.id)} className="text-muted-foreground hover:bg-accent hover:text-accent-foreground" aria-label={page.favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}><Star size={11} className={page.favorite ? 'fill-current' : ''} /></Button></TooltipTrigger><TooltipContent>{page.favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}</TooltipContent></Tooltip>
          </div>
        </TooltipProvider>
      </motion.div>

      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden">
            {children.map((child, index) => <PageNode key={child.id} page={child} pages={pages} depth={depth + 1} isLast={index === children.length - 1} activeId={activeId} expanded={expanded} toggle={toggle} onSelect={onSelect} onFavorite={onFavorite} onAddChild={onAddChild} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function PageTree({ pages, activeId, onSelect, onFavorite, onAddChild }: PageTreeProps) {
  const autoExpanded = useMemo(() => parentIdsFor(pages, activeId), [pages, activeId])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  useEffect(() => setExpanded((current) => new Set([...current, ...autoExpanded])), [autoExpanded])
  const toggle = (id: string) => setExpanded((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next })

  return <MotionConfig reducedMotion="user"><nav aria-label="Struktura stránek" className="py-1">{childrenOf(pages, null).map((page, index, roots) => <PageNode key={page.id} page={page} pages={pages} depth={0} isLast={index === roots.length - 1} activeId={activeId} expanded={expanded} toggle={toggle} onSelect={onSelect} onFavorite={onFavorite} onAddChild={onAddChild} />)}</nav></MotionConfig>
}
