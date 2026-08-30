'use client'

import { useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FilePlus2, Focus, Moon, Redo2, Star, Sun, Trash2, Undo2 } from 'lucide-react'
import { dataService } from '@/lib/data-service'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command'
import { Page } from '@/lib/storage'

type Props = {
  pages: Page[]
  query: string
  dark: boolean
  canUndo: boolean
  canRedo: boolean
  onQuery: (value: string) => void
  onClose: () => void
  onSelect: (id: string) => void
  onCreate: () => void
  onToggleFavorite: () => void
  onTrash: () => void
  onUndo: () => void
  onRedo: () => void
  onToggleFocus: () => void
  onToggleTheme: () => void
}

export default function CommandPalette(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const results = useMemo(
    () => dataService.search(props.pages.filter((page) => !page.trashedAt), props.query).slice(0, 10),
    [props.pages, props.query],
  )

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [props.onClose])

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center bg-black/35 p-3 backdrop-blur-[3px] sm:p-8" onMouseDown={props.onClose}>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.985 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="mt-[7vh] w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Hledání a příkazy"
      >
        <Command shouldFilter={false}>
          <CommandInput ref={inputRef} value={props.query} onValueChange={props.onQuery} placeholder="Hledat stránku nebo příkaz…" />
          <CommandList className="max-h-[58vh]">
            <CommandEmpty>Nic nenalezeno.</CommandEmpty>
            {props.query.trim() ? (
              <CommandGroup heading="Stránky">
                {results.map((page) => (
                  <CommandItem key={page.id} value={page.id} onSelect={() => props.onSelect(page.id)}>
                    <span className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground"><span aria-hidden="true">{page.icon || '📄'}</span></span>
                    <span className="min-w-0 flex-1 truncate">{page.title || 'Bez názvu'}</span>
                    <CommandShortcut>{page.blocks.length} bloků</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <>
                <CommandGroup heading="Vytvořit">
                  <CommandItem onSelect={props.onCreate}><FilePlus2 /><span>Nová stránka</span><CommandShortcut>⌘N</CommandShortcut></CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Workspace">
                  <CommandItem onSelect={props.onToggleFavorite}><Star /><span>Oblíbená stránka</span></CommandItem>
                  <CommandItem onSelect={props.onTrash}><Trash2 /><span>Otevřít koš</span></CommandItem>
                  <CommandItem disabled={!props.canUndo} onSelect={props.onUndo}><Undo2 /><span>Zpět</span><CommandShortcut>⌘Z</CommandShortcut></CommandItem>
                  <CommandItem disabled={!props.canRedo} onSelect={props.onRedo}><Redo2 /><span>Znovu</span><CommandShortcut>⇧⌘Z</CommandShortcut></CommandItem>
                  <CommandItem onSelect={props.onToggleFocus}><Focus /><span>Focus mode</span><CommandShortcut>⇧⌘F</CommandShortcut></CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Vzhled">
                  <CommandItem onSelect={props.onToggleTheme}>{props.dark ? <Sun /> : <Moon />}<span>{props.dark ? 'Světlý režim' : 'Tmavý režim'}</span></CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground"><span>↑↓ navigace</span><span>Enter otevřít</span><span>Esc zavřít</span></div>
      </motion.div>
    </div>
  )
}
