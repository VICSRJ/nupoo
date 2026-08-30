'use client'

import { useMemo } from 'react'
import { RotateCcw, Trash2, X } from 'lucide-react'
import type { Page } from '@/lib/storage'

export default function TrashDialog({ trash, onRestore, onDelete, onEmpty, onClose }: { trash: Page[]; onRestore: (id: string) => void; onDelete: (id: string) => void; onEmpty: () => void; onClose: () => void }) {
  const grouped = useMemo(() => [...trash].sort((a, b) => (b.trashedAt || '').localeCompare(a.trashedAt || '')), [trash])
  return <div className="fixed inset-0 z-[105] bg-black/25 p-3 backdrop-blur-sm md:p-8" onMouseDown={onClose}>
    <div className="mx-auto mt-[9vh] w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950/95" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800"><Trash2 size={16} /><div className="flex-1 text-sm font-semibold">Koš</div><button onClick={onClose} className="rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900" aria-label="Zavřít"><X size={16} /></button></div>
      <div className="max-h-[55vh] overflow-auto p-2">
        {grouped.length === 0 && <div className="px-4 py-12 text-center text-sm text-zinc-500">Koš je prázdný.</div>}
        {grouped.map((page) => <div key={page.id} className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-900"><span className="text-lg">{page.icon || '📄'}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{page.title || 'Bez názvu'}</div><div className="text-xs text-zinc-400">{page.trashedAt ? new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'short' }).format(new Date(page.trashedAt)) : ''}</div></div><button onClick={() => onRestore(page.id)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white" title="Obnovit" aria-label="Obnovit"><RotateCcw size={15} /></button><button onClick={() => onDelete(page.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" title="Trvale smazat" aria-label="Trvale smazat"><Trash2 size={15} /></button></div>)}
      </div>
      {grouped.length > 0 && <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-800"><span className="text-xs text-zinc-400">{grouped.length} položek</span><button onClick={onEmpty} className="text-xs font-medium text-red-500 hover:text-red-600">Vysypat koš</button></div>}
    </div>
  </div>
}
