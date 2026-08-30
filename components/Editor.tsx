'use client'

import { useEffect, useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import { motion } from 'framer-motion'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EditorContent, useEditor } from '@tiptap/react'
import { Bold, Check, Code2, Copy, GripVertical, Heading, Highlighter, Italic, Link2, List, ListCheck, ListOrdered, Minus, Plus, Quote, Strikethrough, Table2, Trash2, Underline as UnderlineIcon } from 'lucide-react'
import { blockContent, type Block, type BlockType, type Page } from '@/lib/storage'
import { createEditorExtensions } from '@/lib/editor-extensions'

type MenuItem = { type: BlockType; label: string; icon: React.ReactNode; shortcut: string }

const BLOCK_TYPES: MenuItem[] = [
  { type: 'paragraph', label: 'Text', shortcut: 'text', icon: <span className="text-xs font-semibold">T</span> },
  { type: 'heading', label: 'Nadpis', shortcut: 'heading', icon: <Heading size={14} /> },
  { type: 'bulletList', label: 'Odrážky', shortcut: 'bullet', icon: <List size={14} /> },
  { type: 'orderedList', label: 'Číslování', shortcut: 'number', icon: <ListOrdered size={14} /> },
  { type: 'taskList', label: 'Úkoly', shortcut: 'todo', icon: <ListCheck size={14} /> },
  { type: 'blockquote', label: 'Citace', shortcut: 'quote', icon: <Quote size={14} /> },
  { type: 'codeBlock', label: 'Kód', shortcut: 'code', icon: <Code2 size={14} /> },
  { type: 'horizontalRule', label: 'Oddělovač', shortcut: 'hr', icon: <Minus size={14} /> },
  { type: 'table', label: 'Tabulka', shortcut: 'table', icon: <Table2 size={14} /> },
]

function typeLabel(block: Block) { return block.type === 'heading' ? `Nadpis ${block.level || 1}` : BLOCK_TYPES.find((item) => item.type === block.type)?.label || 'Text' }

function TypeMenu({ block, onChange }: { block: Block; onChange: (type: BlockType, level?: 1 | 2 | 3) => void }) {
  return <div className="block-type-menu" onMouseDown={(event) => event.stopPropagation()}><div className="block-menu-title">Změnit typ</div>{BLOCK_TYPES.map((item) => <button key={item.type} type="button" onClick={() => onChange(item.type, item.type === 'heading' ? block.level || 1 : undefined)} className={`block-type-item ${block.type === item.type ? 'is-active' : ''}`}><span className="block-menu-icon">{item.icon}</span><span>{item.label}</span><kbd className="ml-auto text-[9px] text-zinc-400">/{item.shortcut}</kbd>{block.type === item.type && <Check size={12} />}</button>)}{block.type === 'heading' && <><div className="block-menu-separator" /><div className="block-menu-title">Úroveň</div>{[1, 2, 3].map((level) => <button key={level} type="button" onClick={() => onChange('heading', level as 1 | 2 | 3)} className={`block-type-item ${block.level === level ? 'is-active' : ''}`}><span className="block-menu-icon heading-level">H{level}</span><span>Nadpis {level}</span>{block.level === level && <Check size={12} />}</button>)}</>}</div>
}

function SlashMenu({ query, onPick }: { query: string; onPick: (item: MenuItem) => void }) {
  const normalized = query.replace(/^\//, '').toLocaleLowerCase('cs-CZ')
  const items = BLOCK_TYPES.filter((item) => item.label.toLocaleLowerCase('cs-CZ').includes(normalized) || item.shortcut.includes(normalized)).slice(0, 9)
  return <div className="slash-menu" onMouseDown={(event) => event.preventDefault()}>{items.length ? items.map((item) => <button key={item.type} type="button" onClick={() => onPick(item)} className="block-type-item"><span className="block-menu-icon">{item.icon}</span><span>{item.label}</span><kbd className="ml-auto text-[9px] text-zinc-400">/{item.shortcut}</kbd></button>) : <div className="px-3 py-3 text-xs text-zinc-400">Žádný příkaz.</div>}</div>
}

function InlineToolbar({ editor, position }: { editor: ReturnType<typeof useEditor>; position: { left: number; top: number } | null }) {
  if (!editor || !position) return null
  const setLink = () => {
    const href = window.prompt('URL odkazu', editor.getAttributes('link').href || '')
    if (href === null) return
    if (!href.trim()) editor.chain().focus().unsetLink().run()
    else editor.chain().focus().setLink({ href: href.trim() }).run()
  }
  return <motion.div initial={{ opacity: 0, scale: 0.96, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="inline-toolbar" style={{ left: position.left, top: position.top }} onMouseDown={(event) => event.preventDefault()}><button className={`inline-tool ${editor.isActive('bold') ? 'is-active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Tučné"><Bold size={14} /></button><button className={`inline-tool ${editor.isActive('italic') ? 'is-active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Kurzíva"><Italic size={14} /></button><button className={`inline-tool ${editor.isActive('underline') ? 'is-active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()} aria-label="Podtržení"><UnderlineIcon size={14} /></button><button className={`inline-tool ${editor.isActive('strike') ? 'is-active' : ''}`} onClick={() => editor.chain().focus().toggleStrike().run()} aria-label="Přeškrtnutí"><Strikethrough size={14} /></button><button className={`inline-tool ${editor.isActive('highlight') ? 'is-active' : ''}`} onClick={() => editor.chain().focus().toggleHighlight().run()} aria-label="Zvýraznění"><Highlighter size={14} /></button><button className={`inline-tool ${editor.isActive('code') ? 'is-active' : ''}`} onClick={() => editor.chain().focus().toggleCode().run()} aria-label="Inline kód"><Code2 size={14} /></button><button className={`inline-tool ${editor.isActive('link') ? 'is-active' : ''}`} onClick={setLink} aria-label="Odkaz"><Link2 size={14} /></button></motion.div>
}

function Row({ block, active, onActivate, onContextMenu, onUpdate, onAdd }: { block: Block; active: boolean; onActivate: () => void; onContextMenu: (event: React.MouseEvent) => void; onUpdate: (value: Partial<Block>) => void; onAdd: () => void }) {
  const [typeMenuOpen, setTypeMenuOpen] = useState(false)
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [inlinePosition, setInlinePosition] = useState<{ left: number; top: number } | null>(null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const editor = useEditor({
    extensions: createEditorExtensions(),
    content: blockContent(block),
    immediatelyRender: false,
    editorProps: {
      attributes: { 'aria-label': typeLabel(block), role: 'textbox' },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Escape') { setSlashOpen(false); setInlinePosition(null); return false }
        if (event.key === '/' && editor && !editor.getText().trim()) { setSlashOpen(true); setSlashQuery('/'); return false }
        return false
      },
    },
    onFocus: onActivate,
    onBlur: () => window.setTimeout(() => setInlinePosition(null), 0),
    onSelectionUpdate: ({ editor: currentEditor }) => {
      if (!currentEditor.isFocused || currentEditor.state.selection.empty) { setInlinePosition(null); return }
      const { from, to } = currentEditor.state.selection
      const start = currentEditor.view.coordsAtPos(from)
      const end = currentEditor.view.coordsAtPos(to)
      const centerX = (Math.min(start.left, end.left) + Math.max(start.right, end.right)) / 2
      const toolbarWidth = 224
      const toolbarHeight = 36
      const gap = 9
      const left = Math.max(8, Math.min(window.innerWidth - toolbarWidth - 8, centerX - toolbarWidth / 2))
      const above = Math.min(start.top, end.top) - toolbarHeight - gap
      const below = Math.max(start.bottom, end.bottom) + gap
      const top = above >= 8 ? above : below
      setInlinePosition({ left, top: Math.max(8, Math.min(window.innerHeight - toolbarHeight - 8, top)) })
    },
    onUpdate: ({ editor: currentEditor }) => {
      const text = currentEditor.getText()
      onUpdate({ text, content: currentEditor.getJSON() })
      if (text.startsWith('/') && text.length <= 40 && !text.includes('\n')) { setSlashOpen(true); setSlashQuery(text) }
      else if (!text.startsWith('/')) { setSlashOpen(false); setSlashQuery('') }
    },
  })

  useEffect(() => { if (!editor || editor.isFocused) return; const incoming = blockContent(block); if (JSON.stringify(editor.getJSON()) !== JSON.stringify(incoming)) editor.commands.setContent(incoming, false) }, [block, editor])
  useEffect(() => {
    if (!editor) return
    const updatePosition = () => {
      if (!editor.isFocused || editor.state.selection.empty) return
      const { from, to } = editor.state.selection
      const start = editor.view.coordsAtPos(from)
      const end = editor.view.coordsAtPos(to)
      const toolbarWidth = 224
      const toolbarHeight = 36
      const gap = 9
      const centerX = (Math.min(start.left, end.left) + Math.max(start.right, end.right)) / 2
      const left = Math.max(8, Math.min(window.innerWidth - toolbarWidth - 8, centerX - toolbarWidth / 2))
      const above = Math.min(start.top, end.top) - toolbarHeight - gap
      const below = Math.max(start.bottom, end.bottom) + gap
      const top = above >= 8 ? above : below
      setInlinePosition({ left, top: Math.max(8, Math.min(window.innerHeight - toolbarHeight - 8, top)) })
    }
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => { window.removeEventListener('resize', updatePosition); window.removeEventListener('scroll', updatePosition, true) }
  }, [editor])

  const changeType = (type: BlockType, level?: 1 | 2 | 3) => {
    const next: Block = { ...block, type, ...(type === 'heading' ? { level: level || 1 } : {}) }
    const nextContent = blockContent(next)
    onUpdate({ ...next, content: nextContent }); editor?.commands.setContent(nextContent, false); editor?.commands.focus('start'); setTypeMenuOpen(false); setSlashOpen(false); setSlashQuery(''); onActivate()
  }

  const pickSlash = (item: MenuItem) => {
    if (!editor) return
    const next: Block = { ...block, type: item.type, ...(item.type === 'heading' ? { level: 1 as const } : {}), text: '' }
    const nextContent = blockContent(next)
    editor.commands.setContent(nextContent, false); editor.commands.focus('start'); onUpdate({ ...next, content: nextContent }); setSlashOpen(false); setSlashQuery('')
  }

  const slashOffset = useMemo(() => (slashOpen && editor ? Math.min(editor.getText().length * 0.2, 18) : 0), [slashOpen, editor])
  return <div ref={setNodeRef} onFocusCapture={onActivate} onContextMenu={onContextMenu} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.55 : 1 }} className={`block-row relative flex min-w-0 items-start rounded-md ${active ? 'is-active' : ''}`}>
    <div className={`block-toolbar ${active ? 'is-visible' : ''}`} onMouseDown={(event) => event.preventDefault()}><button type="button" onClick={onAdd} aria-label="Přidat blok" className="block-control"><Plus size={13} /></button><div className="relative"><button type="button" onClick={() => setTypeMenuOpen((value) => !value)} aria-label={`Změnit typ: ${typeLabel(block)}`} className={`block-control ${typeMenuOpen ? 'is-pressed' : ''}`}><span className="flex items-center">{BLOCK_TYPES.find((item) => item.type === block.type)?.icon}</span></button>{typeMenuOpen && <TypeMenu block={block} onChange={changeType} />}</div><button type="button" {...listeners} {...attributes} aria-label="Přesunout blok" className="block-control cursor-grab active:cursor-grabbing"><GripVertical size={13} /></button></div>
    <div className="relative min-w-0 flex-1 py-0.5"><InlineToolbar editor={editor} position={active ? inlinePosition : null} />{slashOpen && editor && <div className="absolute left-0 top-full z-40" style={{ transform: `translateY(${slashOffset}px)` }}><SlashMenu query={slashQuery} onPick={pickSlash} /></div>}{editor && <motion.div layout="position" transition={{ layout: { duration: 0.18, ease: 'easeOut' } }}><EditorContent editor={editor} className="tiptap" /></motion.div>}</div>
  </div>
}

export default function Editor({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  const [blocks, setBlocks] = useState(page.blocks)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [context, setContext] = useState<{ blockId: string; x: number; y: number } | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  useEffect(() => { setBlocks(page.blocks); setActiveBlockId(null); setContext(null) }, [page.id, page.blocks])
  const persist = (next: Block[]) => { setBlocks(next); onChange({ ...page, blocks: next, updatedAt: new Date().toISOString() }) }
  const addAt = (index: number) => { const nextBlock: Block = { id: nanoid(), type: 'paragraph', text: '' , content: blockContent({ type: 'paragraph', text: '' } as Block) }; persist([...blocks.slice(0, index + 1), nextBlock, ...blocks.slice(index + 1)]); setActiveBlockId(nextBlock.id) }
  const duplicateBlock = (index: number) => {
    const source = blocks[index]
    if (!source) return
    const duplicate: Block = source.content
      ? { ...source, id: nanoid(), content: structuredClone(source.content) }
      : { ...source, id: nanoid() }
    persist([...blocks.slice(0, index + 1), duplicate, ...blocks.slice(index + 1)])
    setActiveBlockId(duplicate.id)
    setContext(null)
  }
  const deleteBlock = (index: number) => { const next = blocks.filter((_, i) => i !== index); persist(next); setActiveBlockId(next[Math.min(index, next.length - 1)]?.id || null); setContext(null) }
  const changeBlockTypeFromContext = (type: BlockType) => {
    if (!contextBlock) return
    const next: Block = { ...contextBlock, type, ...(type === 'heading' ? { level: contextBlock.level || 1 } : {}) }
    const nextContent = blockContent(next)
    persist(blocks.map((item) => item.id === contextBlock.id ? { ...next, content: nextContent } : item))
    setContext(null)
    setActiveBlockId(next.id)
  }
  const drag = (event: DragEndEvent) => { if (!event.over || event.active.id === event.over.id) return; const from = blocks.findIndex((block) => block.id === event.active.id); const to = blocks.findIndex((block) => block.id === event.over?.id); if (from >= 0 && to >= 0) persist(arrayMove(blocks, from, to)) }
  useEffect(() => { const close = () => setContext(null); const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setContext(null) }; window.addEventListener('mousedown', close); window.addEventListener('keydown', escape); return () => { window.removeEventListener('mousedown', close); window.removeEventListener('keydown', escape) } }, [])
  const contextIndex = context ? blocks.findIndex((block) => block.id === context.blockId) : -1
  const contextBlock = contextIndex >= 0 ? blocks[contextIndex] : null

  return <article className="mx-auto max-w-4xl px-3 py-10 sm:px-5 md:px-10 md:py-16" onMouseDown={(event) => { const target = event.target as HTMLElement; if (!target.closest('.block-row') && !target.closest('.block-context-menu')) setActiveBlockId(null) }}>
    <div className="mb-8 pl-[76px] md:pl-[84px]"><div className="mb-3 text-5xl">{page.icon || '📄'}</div><input value={page.title} onChange={(event) => onChange({ ...page, title: event.target.value, updatedAt: new Date().toISOString() })} className="w-full bg-transparent text-4xl font-bold tracking-tight outline-none placeholder:text-zinc-300 sm:text-5xl" placeholder="Bez názvu" /><div className="mt-2 text-xs text-zinc-400">{blocks.length} {blocks.length === 1 ? 'blok' : blocks.length < 5 ? 'bloky' : 'bloků'}</div></div>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={drag}><SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}><div className="space-y-0.5">{blocks.map((block, index) => <Row key={block.id} block={block} active={activeBlockId === block.id} onActivate={() => { setActiveBlockId(block.id); setContext(null) }} onContextMenu={(event) => { event.preventDefault(); setActiveBlockId(block.id); const width = document.documentElement.clientWidth; const height = document.documentElement.clientHeight; setContext({ blockId: block.id, x: Math.min(event.clientX, Math.max(8, width - 238)), y: Math.min(event.clientY, Math.max(8, height - 360)) }) }} onAdd={() => addAt(index)} onUpdate={(update) => persist(blocks.map((item) => item.id === block.id ? { ...item, ...update } : item))} />)}</div></SortableContext></DndContext>
    <button type="button" onClick={() => addAt(Math.max(0, blocks.length - 1))} className="ml-[76px] mt-4 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"><Plus size={13} /> Přidat blok</button>
    {context && contextBlock && <div className="block-context-menu fixed z-50" style={{ left: context.x, top: context.y }} onMouseDown={(event) => event.stopPropagation()}><div className="block-menu-title">{typeLabel(contextBlock)}</div><div className="block-context-grid"><button type="button" className="block-context-item" onClick={() => duplicateBlock(contextIndex)}><Copy size={12} /> Duplikovat</button><button type="button" className="block-context-item danger" onClick={() => deleteBlock(contextIndex)}><Trash2 size={12} /> Smazat</button></div><div className="block-menu-separator" /><div className="block-menu-title">Změnit typ</div>{BLOCK_TYPES.map((item) => <button key={item.type} type="button" className={`block-type-item ${contextBlock.type === item.type ? 'is-active' : ''}`} onClick={() => changeBlockTypeFromContext(item.type)}><span className="block-menu-icon">{item.icon}</span><span>{item.label}</span></button>)}</div>}
  </article>
}
