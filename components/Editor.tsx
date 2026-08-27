'use client'

import { useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import {
  CheckSquare,
  Code2,
  Copy,
  GripVertical,
  Heading1,
  List,
  ListOrdered,
  MoreHorizontal,
  Plus,
  Quote,
  Trash2,
  Type,
} from 'lucide-react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import type { Page, Block } from '@/lib/storage'

const BLOCK_TYPES: Array<{ type: Block['type']; label: string }> = [
  { type: 'paragraph', label: 'Text' },
  { type: 'heading', label: 'Heading 1' },
  { type: 'bulletList', label: 'Bulleted list' },
  { type: 'orderedList', label: 'Numbered list' },
  { type: 'taskList', label: 'Task list' },
  { type: 'blockquote', label: 'Quote' },
  { type: 'codeBlock', label: 'Code' },
]

function escapeHtml(s: string) {
  return s
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
  if (block.type === 'taskList') {
    return `<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>${text}</p></li></ul>`
  }
  if (block.type === 'blockquote') return `<blockquote><p>${text}</p></blockquote>`
  if (block.type === 'codeBlock') return `<pre><code>${text}</code></pre>`
  return `<p>${text}</p>`
}

function iconFor(type: Block['type']) {
  if (type === 'heading') return <Heading1 size={15} />
  if (type === 'bulletList') return <List size={15} />
  if (type === 'orderedList') return <ListOrdered size={15} />
  if (type === 'taskList') return <CheckSquare size={15} />
  if (type === 'blockquote') return <Quote size={15} />
  if (type === 'codeBlock') return <Code2 size={15} />
  return <Type size={15} />
}

function labelFor(block: Block) {
  if (block.type === 'heading') return `Heading ${block.level || 1}`
  return BLOCK_TYPES.find((item) => item.type === block.type)?.label || 'Text'
}

function Row({
  block,
  onUpdate,
  onDelete,
  onDuplicate,
  onAdd,
}: {
  block: Block
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
    onUpdate: ({ editor: currentEditor }) => onUpdate({ text: currentEditor.getText() }),
  })

  useEffect(() => {
    if (editor && !editor.isFocused && editor.getText() !== block.text) {
      editor.commands.setContent(htmlFor(block), false)
    }
  }, [block.text, block.type, block.level, editor])

  const changeType = (type: Block['type']) => {
    const next: Block = {
      ...block,
      type,
      level: type === 'heading' ? block.level || 1 : undefined,
    }
    onUpdate(next)
    if (editor) editor.commands.setContent(htmlFor(next), false)
    setMenuOpen(false)
  }

  const changeHeadingLevel = (level: 1 | 2 | 3) => {
    const next: Block = { ...block, type: 'heading', level }
    onUpdate(next)
    if (editor) editor.commands.setContent(htmlFor(next), false)
    setMenuOpen(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="group flex min-w-0 items-start"
    >
      <div className="flex w-[76px] flex-none items-start justify-end gap-0.5 pr-2 pt-1">
        <button
          type="button"
          onClick={onAdd}
          aria-label="Přidat blok"
          className="block-control"
        >
          <Plus size={15} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Změnit typ bloku"
            aria-expanded={menuOpen}
            className="block-control"
          >
            {iconFor(block.type)}
          </button>

          {menuOpen && (
            <div className="block-type-menu" onMouseDown={(event) => event.stopPropagation()}>
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Typ bloku</div>
              {BLOCK_TYPES.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => changeType(item.type)}
                  className={`block-type-item ${block.type === item.type ? 'is-active' : ''}`}
                >
                  {iconFor(item.type)}
                  <span>{item.label}</span>
                </button>
              ))}
              {block.type === 'heading' && (
                <>
                  <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
                  <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Úroveň nadpisu</div>
                  {[1, 2, 3].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => changeHeadingLevel(level as 1 | 2 | 3)}
                      className={`block-type-item ${block.level === level ? 'is-active' : ''}`}
                    >
                      <MoreHorizontal size={15} />
                      <span>H{level}</span>
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
          <GripVertical size={15} />
        </button>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        {editor && <EditorContent editor={editor} className="tiptap" />}
      </div>

      <div className="flex w-12 flex-none items-start gap-0.5 pl-1 pt-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button type="button" onClick={onDuplicate} aria-label="Duplikovat blok" className="block-control">
          <Copy size={14} />
        </button>
        <button type="button" onClick={onDelete} aria-label="Smazat blok" className="block-control text-red-500">
          <Trash2 size={14} />
        </button>
      </div>

      {menuOpen && <button type="button" aria-label="Zavřít nabídku" className="fixed inset-0 z-10 cursor-default bg-transparent" onClick={() => setMenuOpen(false)} />}
    </div>
  )
}

export default function Editor({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  const [blocks, setBlocks] = useState(page.blocks)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => setBlocks(page.blocks), [page.id, page.blocks])

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

  const addAt = (index: number) =>
    persist([
      ...blocks.slice(0, index + 1),
      { id: nanoid(), type: 'paragraph', text: '' },
      ...blocks.slice(index + 1),
    ])

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
                onAdd={() => addAt(index)}
                onDelete={() => persist(blocks.filter((item) => item.id !== block.id))}
                onDuplicate={() => persist([...blocks.slice(0, index + 1), { ...block, id: nanoid() }, ...blocks.slice(index + 1)])}
                onUpdate={(update) => persist(blocks.map((item) => (item.id === block.id ? { ...item, ...update } : item)))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={() => addAt(Math.max(0, blocks.length - 1))}
        className="ml-[76px] mt-4 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        <Plus size={15} /> Přidat blok
      </button>
    </article>
  )
}
