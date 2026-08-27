'use client'

import { useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import IconifyIcon from './IconifyIcon'
import type { Page, Block } from '@/lib/storage'

const BLOCK_TYPES: Array<{ type: Block['type']; label: string; icon: string }> = [
  { type: 'paragraph', label: 'Text', icon: 'solar:text-outline' },
  { type: 'heading', label: 'Heading', icon: 'solar:text-bold-outline' },
  { type: 'bulletList', label: 'Bulleted list', icon: 'solar:list-broken' },
  { type: 'orderedList', label: 'Numbered list', icon: 'solar:list-number-outline' },
  { type: 'taskList', label: 'Task list', icon: 'solar:checklist-minimalistic-outline' },
  { type: 'blockquote', label: 'Quote', icon: 'solar:quote-up-outline' },
  { type: 'codeBlock', label: 'Code', icon: 'solar:code-square-outline' },
]

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function htmlFor(block: Block) {
  const text = escapeHtml(block.text)
  if (block.type === 'heading') return `<h${block.level || 1}>${text}</h${block.level || 1}>`
  if (block.type === 'bulletList') return `<ul><li><p>${text}</p></li></ul>`
  if (block.type === 'orderedList') return `<ol><li><p>${text}</p></li></ol>`
  if (block.type === 'taskList') return `<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>${text}</p></li></ul>`
  if (block.type === 'blockquote') return `<blockquote><p>${text}</p></blockquote>`
  if (block.type === 'codeBlock') return `<pre><code>${text}</code></pre>`
  return `<p>${text}</p>`
}

function iconFor(type: Block['type'], level?: 1 | 2 | 3) {
  if (type === 'heading') {
    const icon = level === 2 ? 'solar:text-field-focus-outline' : level === 3 ? 'solar:text-field-outline' : 'solar:text-bold-outline'
    return <IconifyIcon icon={icon} size={16} />
  }
  const item = BLOCK_TYPES.find((entry) => entry.type === type)
  return <IconifyIcon icon={item?.icon || 'solar:text-outline'} size={16} />
}

function labelFor(block: Block) {
  if (block.type === 'heading') return `Heading ${block.level || 1}`
  return BLOCK_TYPES.find((item) => item.type === block.type)?.label || 'Text'
}

function Row({
  block,
  active,
  onActivate,
  onUpdate,
  onDelete,
  onDuplicate,
  onAdd,
}: {
  block: Block
  active: boolean
  onActivate: () => void
  onUpdate: (value: Partial<Block>) => void
  onDelete: () => void
  onDuplicate: () => void
  onAdd: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Napiš něco…' }),
    ],
    content: htmlFor(block),
    immediatelyRender: false,
    onFocus: onActivate,
    onUpdate: ({ editor: currentEditor }) => onUpdate({ text: currentEditor.getText() }),
  })

  useEffect(() => {
    if (editor && !editor.isFocused && (editor.getText() !== block.text || editor.getHTML() !== htmlFor(block))) {
      editor.commands.setContent(htmlFor(block), false)
    }
  }, [block.text, block.type, block.level, editor])

  const changeType = (type: Block['type']) => {
    const next: Block = { ...block, type, level: type === 'heading' ? block.level || 1 : undefined }
    onUpdate(next)
    if (editor) editor.commands.setContent(htmlFor(next), false)
    setMenuOpen(false)
    onActivate()
  }

  const changeHeadingLevel = (level: 1 | 2 | 3) => {
    const next: Block = { ...block, type: 'heading', level }
    onUpdate(next)
    if (editor) editor.commands.setContent(htmlFor(next), false)
    setMenuOpen(false)
    onActivate()
  }

  return (
    <div
      ref={setNodeRef}
      onFocusCapture={onActivate}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.52 : 1,
      }}
      className={`group block-row relative flex min-w-0 items-start rounded-md ${active ? 'is-active' : ''}`}
    >
      <div className={`block-toolbar flex w-[76px] flex-none items-start justify-end gap-0.5 pr-2 pt-1 ${active ? 'is-visible' : ''}`}>
        <button type="button" onClick={onAdd} aria-label="Přidat blok" title="Přidat blok" className="block-control">
          <IconifyIcon icon="solar:add-square-outline" size={17} />
        </button>

        <div className="relative">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={`Změnit typ: ${labelFor(block)}`}
            title={labelFor(block)}
            aria-expanded={menuOpen}
            className={`block-control ${menuOpen ? 'is-pressed' : ''}`}
          >
            {iconFor(block.type, block.level)}
          </button>

          {menuOpen && (
            <div className="block-type-menu">
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Změnit typ</div>
              {BLOCK_TYPES.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => changeType(item.type)}
                  className={`block-type-item ${block.type === item.type ? 'is-active' : ''}`}
                >
                  {iconFor(item.type)}
                  <span>{item.label}</span>
                  {block.type === item.type && <IconifyIcon icon="solar:check-circle-outline" size={14} className="ml-auto opacity-60" />}
                </button>
              ))}

              {block.type === 'heading' && (
                <>
                  <div className="my-1.5 border-t border-zinc-200 dark:border-zinc-800" />
                  <div className="flex items-center gap-1 px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    <IconifyIcon icon="solar:text-field-focus-outline" size={13} /> Úroveň
                  </div>
                  {[1, 2, 3].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => changeHeadingLevel(level as 1 | 2 | 3)}
                      className={`block-type-item ${block.level === level ? 'is-active' : ''}`}
                    >
                      {iconFor('heading', level as 1 | 2 | 3)}
                      <span>H{level}</span>
                      {block.level === level && <IconifyIcon icon="solar:check-circle-outline" size={14} className="ml-auto opacity-60" />}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          {...listeners}
          {...attributes}
          aria-label="Přesunout blok"
          title="Přesunout blok"
          className="block-control cursor-grab active:cursor-grabbing"
        >
          <IconifyIcon icon="solar:menu-dots-square-outline" size={17} />
        </button>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        {editor && <EditorContent editor={editor} className="tiptap" />}
      </div>

      <div className={`block-actions flex w-12 flex-none items-start gap-0.5 pl-1 pt-1 ${active ? 'is-visible' : ''}`}>
        <button type="button" onClick={onDuplicate} aria-label="Duplikovat blok" title="Duplikovat" className="block-control">
          <IconifyIcon icon="solar:copy-outline" size={15} />
        </button>
        <button type="button" onClick={onDelete} aria-label="Smazat blok" title="Smazat" className="block-control text-red-500">
          <IconifyIcon icon="solar:trash-bin-minimalistic-outline" size={15} />
        </button>
      </div>

      {menuOpen && <button type="button" aria-label="Zavřít nabídku" className="fixed inset-0 z-10 cursor-default bg-transparent" onClick={() => setMenuOpen(false)} />}
    </div>
  )
}

export default function Editor({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  const [blocks, setBlocks] = useState(page.blocks)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    setBlocks(page.blocks)
    setActiveBlockId(null)
  }, [page.id, page.blocks])

  const persist = (next: Block[]) => {
    setBlocks(next)
    onChange({ ...page, blocks: next, updatedAt: new Date().toISOString() })
  }

  const drag = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return
    const from = blocks.findIndex((block) => block.id === event.active.id)
    const to = blocks.findIndex((block) => block.id === event.over?.id)
    if (from >= 0 && to >= 0) persist(arrayMove(blocks, from, to))
  }

  const addAt = (index: number) => {
    const nextBlock = { id: nanoid(), type: 'paragraph' as const, text: '' }
    persist([...blocks.slice(0, index + 1), nextBlock, ...blocks.slice(index + 1)])
    setActiveBlockId(nextBlock.id)
  }

  return (
    <article className="mx-auto max-w-4xl px-3 py-10 sm:px-5 md:px-10 md:py-16">
      <div className="mb-8 pl-[76px] md:pl-[84px]">
        <div className="mb-3 text-5xl">{page.icon || '📄'}</div>
        <input
          value={page.title}
          onChange={(event) => onChange({ ...page, title: event.target.value, updatedAt: new Date().toISOString() })}
          className="w-full bg-transparent text-4xl font-bold tracking-tight outline-none placeholder:text-zinc-300 sm:text-5xl"
          placeholder="Bez názvu"
        />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={drag}>
        <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-0.5">
            {blocks.map((block, index) => (
              <Row
                key={block.id}
                block={block}
                active={activeBlockId === block.id}
                onActivate={() => setActiveBlockId(block.id)}
                onAdd={() => addAt(index)}
                onDelete={() => {
                  const next = blocks.filter((item) => item.id !== block.id)
                  persist(next)
                  setActiveBlockId(next[Math.min(index, next.length - 1)]?.id || null)
                }}
                onDuplicate={() => {
                  const duplicate = { ...block, id: nanoid() }
                  persist([...blocks.slice(0, index + 1), duplicate, ...blocks.slice(index + 1)])
                  setActiveBlockId(duplicate.id)
                }}
                onUpdate={(update) => persist(blocks.map((item) => (item.id === block.id ? { ...item, ...update } : item)))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={() => addAt(Math.max(0, blocks.length - 1))}
        className="ml-[76px] mt-4 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        <IconifyIcon icon="solar:add-square-outline" size={16} /> Přidat blok
      </button>
    </article>
  )
}
