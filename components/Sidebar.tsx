'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Archive, ChevronDown, Download, FilePlus2, Folder, PanelLeftClose, Search, Settings2, Star, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import PageTree from './PageTree'
import type { Page } from '@/lib/storage'

type SidebarProps = {
  pages: Page[]
  trashCount: number
  favoriteCount: number
  recent: Page[]
  activePageId: string
  query: string
  onSelect: (id: string) => void
  onCreate: (parentId?: string | null) => void
  onSearch: () => void
  onFavorite: (id: string) => void
  onTrash: () => void
  onExport: () => void
  onImport: () => void
  onToggleOpen: () => void
  onCloseMobile?: () => void
  mobile?: boolean
}

function NavButton({ icon, children, shortcut, onClick, active = false }: { icon: React.ReactNode; children: React.ReactNode; shortcut?: string; onClick: () => void; active?: boolean }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`group h-9 w-full justify-start gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-[background,color,box-shadow,transform] duration-150 active:scale-[.985] ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'}`}
    >
      <span className="grid size-5 shrink-0 place-items-center text-muted-foreground group-hover:text-current">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-left">{children}</span>
      {shortcut && <kbd className="rounded-md border border-sidebar-border bg-sidebar-accent/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{shortcut}</kbd>}
    </Button>
  )
}

function SectionHeader({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <div className="flex items-center gap-2 px-2.5 pb-1.5 pt-5 text-[10px] font-semibold uppercase tracking-[.16em] text-sidebar-foreground/45">{icon}<span>{children}</span></div>
}

export default function Sidebar(props: SidebarProps) {
  const favorites = props.pages.filter((page) => page.favorite && !page.trashedAt).slice(0, 6)
  return (
    <motion.aside
      initial={props.mobile ? { x: '-100%' } : false}
      animate={{ x: 0 }}
      exit={props.mobile ? { x: '-100%' } : undefined}
      transition={{ type: 'spring', stiffness: 360, damping: 34 }}
      className={`${props.mobile ? 'fixed inset-y-0 left-0 z-50 w-[min(88vw,340px)] shadow-2xl md:hidden' : 'hidden w-[286px] shrink-0 md:flex'} flex flex-col border-r border-sidebar-border/80 bg-sidebar-background/96 text-sidebar-foreground backdrop-blur-xl`}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border/70 px-3">
        <div className="grid size-8 place-items-center rounded-[10px] bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_2px_10px_hsl(var(--neu-lo))]">
          <span className="text-[13px] font-bold tracking-[-.04em]">N</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold tracking-[-.01em]">Nupoo</div>
          <div className="mt-0.5 text-[10px] tracking-[.14em] text-sidebar-foreground/40">LOCAL WORKSPACE</div>
        </div>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={props.onToggleOpen} className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" aria-label="Skrýt postranní panel"><PanelLeftClose size={15} /></Button>
            </TooltipTrigger>
            <TooltipContent>Schovat panel</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="px-2.5 pt-3">
        <motion.button
          whileTap={{ scale: 0.985 }}
          onClick={props.onSearch}
          className="neu-lite neu-lite-hover flex h-9 w-full items-center gap-2 rounded-lg border-sidebar-border bg-sidebar-accent/35 px-2.5 text-left text-[12px] text-sidebar-foreground/65 shadow-none transition-colors hover:text-sidebar-foreground"
        >
          <Search size={14} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">Hledat stránky…</span>
          <kbd className="rounded-md border border-sidebar-border/80 bg-sidebar-background/70 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">⌘K</kbd>
        </motion.button>
      </div>

      <div className="px-2.5 pt-2">
        <NavButton icon={<FilePlus2 size={15} />} shortcut="⌘N" onClick={() => props.onCreate(null)}>Nová stránka</NavButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
        {favorites.length > 0 && (
          <section>
            <SectionHeader icon={<Star size={11} className="fill-current" />}>Oblíbené</SectionHeader>
            <div className="space-y-0.5">
              {favorites.map((page) => (
                <NavButton key={page.id} icon={<Star size={13} className="fill-current" />} active={props.activePageId === page.id} onClick={() => props.onSelect(page.id)}>{page.title || 'Bez názvu'}</NavButton>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeader icon={<Folder size={11} />}>Stránky</SectionHeader>
          <div className="rounded-xl border border-sidebar-border/55 bg-sidebar-background/35 p-1.5 shadow-[inset_0_1px_0_hsl(var(--neu-hi))]">
            <PageTree pages={props.pages} activeId={props.activePageId} onSelect={props.onSelect} onFavorite={props.onFavorite} onAddChild={(id) => props.onCreate(id)} />
          </div>
        </section>

        {props.recent.length > 0 && (
          <section>
            <SectionHeader icon={<Archive size={11} />}>Nedávné</SectionHeader>
            <div className="space-y-0.5">
              {props.recent.map((page) => (
                <NavButton key={page.id} icon={<span className="text-[12px]">{page.icon || '◻'}</span>} active={props.activePageId === page.id} onClick={() => props.onSelect(page.id)}>{page.title || 'Bez názvu'}</NavButton>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="border-t border-sidebar-border/70 p-2.5">
        <div className="space-y-0.5">
          <NavButton icon={<Trash2 size={15} />} onClick={props.onTrash}>Koš {props.trashCount > 0 && <span className="text-[11px] text-muted-foreground">{props.trashCount}</span>}</NavButton>
          <NavButton icon={<Download size={15} />} onClick={props.onExport}>Exportovat</NavButton>
          <NavButton icon={<Upload size={15} />} onClick={props.onImport}>Importovat</NavButton>
          <NavButton icon={<Settings2 size={15} />} onClick={() => {}}>Nastavení</NavButton>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-lg bg-sidebar-accent/35 px-2.5 py-2 text-[10px] text-sidebar-foreground/45">
          <span>{props.favoriteCount} oblíbených</span>
          <span>offline-ready</span>
        </div>
      </div>
    </motion.aside>
  )
}
