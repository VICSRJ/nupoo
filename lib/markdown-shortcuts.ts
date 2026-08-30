import { Extension } from '@tiptap/core'

type ShortcutEditor = {
  state: {
    selection: {
      $from: {
        parent: { textContent: string }
        pos: number
        start: () => number
      }
    }
  }
  commands: {
    deleteRange: (range: { from: number; to: number }) => boolean
    toggleHeading: (attrs: { level: 1 | 2 | 3 }) => boolean
    toggleBulletList: () => boolean
    toggleOrderedList: () => boolean
    toggleTaskList: () => boolean
    toggleBlockquote: () => boolean
    setHorizontalRule: () => boolean
  }
}

const MARKERS: Array<{ pattern: RegExp; action: (editor: ShortcutEditor) => boolean }> = [
  { pattern: /^### $/, action: (editor) => editor.commands.toggleHeading({ level: 3 }) },
  { pattern: /^## $/, action: (editor) => editor.commands.toggleHeading({ level: 2 }) },
  { pattern: /^# $/, action: (editor) => editor.commands.toggleHeading({ level: 1 }) },
  { pattern: /^> $/, action: (editor) => editor.commands.toggleBlockquote() },
  { pattern: /^- $/, action: (editor) => editor.commands.toggleBulletList() },
  { pattern: /^\* $/, action: (editor) => editor.commands.toggleBulletList() },
  { pattern: /^\d+\. $/, action: (editor) => editor.commands.toggleOrderedList() },
  { pattern: /^\[ \] $/, action: (editor) => editor.commands.toggleTaskList() },
  { pattern: /^---$/, action: (editor) => editor.commands.setHorizontalRule() },
]

export const MarkdownShortcuts = Extension.create({
  name: 'markdownShortcuts',

  addKeyboardShortcuts() {
    return {
      Space: () => {
        const editor = this.editor as unknown as ShortcutEditor
        const { $from } = editor.state.selection
        const text = $from.parent.textContent
        const start = $from.start()

        const marker = MARKERS.find(({ pattern }) => pattern.test(text))
        if (!marker) return false

        if (!editor.commands.deleteRange({ from: start, to: $from.pos })) return false
        return marker.action(editor)
      },
    }
  },
})
