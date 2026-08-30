'use client'

import { useEffect, useMemo, useState } from 'react'
import { FilePlus2, Focus, Moon, Search, Star, Sun, Trash2, Undo2, Redo2 } from 'lucide-react'
import { dataService } from '@/lib/data-service'
import type { Page } from '@/lib/storage'

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

type Action = { id: string; label: string; hint?: string; icon: React.ReactNode; run: () => void }

export default function CommandPalette(props: Props) {
  const [selected, setSelected] = useState(0)
  const results = useMemo(() => dataService.search(props.pages.filter((page) => !page.trashedAt), props.query).slice(0, 7), [props.pages, props.query])
  const actions: Action[] = [
    { id: 'new', label: 'Nová stránka', hint: '⌘N', icon: <FilePlus2 size={15} />, run: props.onCreate },
    { id: 'favorite', label: 'Přidat na oblíbené', icon: <Star size={15} />, run: props.onToggleFavorite },
    { id: 'trash', label: 'Otevřít koš', icon: <Trash2 size={15} />, run: props.onTrash },
    { id: 'undo', label: 'Zpět', hint: '⌘Z', icon: <Undo2 size={15} />, run: props.onUndo },
    { id: 'redo', label: 'Znovu', hint: '⇧⌘Z', icon: <Redo2 size={15} />, run: props.onRedo },
    { id: 'focus', label: 'Focus mode', hint: '⇧⌘F', icon: <Focus size={15} />, run: props.onToggleFocus },
    { id: 'theme', label: props.dark ? 'Světlý režim' : 'Tmavý režim', icon: props.dark ? <Sun size={15} /> : <Moon size={15} />, run: props.onToggleTheme },
  ]
  const visible = props.query.trim() ? results.map((page) => ({ id: page.id, label: page.title || 'Bez názvu', hint: `${page.blocks.length} bloků`, icon: <Search size={15} />, run: () => props.onSelect(page.id) })) : actions

  useEffect(() => setSelected(0), [props.query])
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') { event.preventDefault(); setSelected((value) => Math.min(value + 1, visible.length - 1)) }
      if (event.key === 'ArrowUp') { event.preventDefault(); setSelected((value) => Math.max(value - 1, 0)) }
      if (event.key === 'Enter' && visible[selected]) { event.preventDefault(); visible[selected].run() }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [selected, visible])

  return <div className="fixed inset-0 z-[110] bg-black/25 p-3 backdrop-blur-sm md:p-8" onMouseDown={props.onClose}>
    <div className="mx-auto mt-[7vh] w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950/95" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
        <Search size={17} className="text-zinc-400" />
        <input autoFocus value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder="Hledat nebo spustit příkaz…" className="h-14 flex-1 bg-transparent text-base outline-none" />
        <kbd className="rounded-md border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-400 dark:border-zinc-800">Esc</kbd>
      </div>
      <div className="max-h-[58vh] overflow-auto p-2">
        {visible.length === 0 && <div className="px-3 py-10 text-center text-sm text-zinc-500">Nic nenalezeno.</div>}
        {visible.map((item, index) => <button key={item.id} onMouseEnter={() => setSelected(index)} onClick={item.run} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${selected === index ? 'bg-zinc-100 dark:bg-zinc-900' : ''}`}>
          <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-zinc-200 text-zinc-500 dark:border-zinc-800">{item.icon}</span>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.hint && <kbd className="text-[10px] text-zinc-400">{item.hint}</kbd>}
        </button>)}
      </div>
      <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2 text-[10px] text-zinc-400 dark:border-zinc-800"><span>↑↓ navigace</span><span>Enter otevřít</span></div>
    </div>
  </div>
}
