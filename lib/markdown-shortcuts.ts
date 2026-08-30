import { Extension } from '@tiptap/core'

type ShortcutEditor = {
  state: { selection: { $from: { parent: { textContent: string }; pos: number; start: () => number } } }
  commands: {
    deleteRange: (range: { from: number; to: number }) => boolean
    toggleTaskList: () => boolean
    setHorizontalRule: () => boolean
  }
}

export const MarkdownShortcuts = Extension.create({
  name: 'markdownShortcuts',

  addKeyboardShortcuts() {
    return {
      Space: () => {
        const editor = this.editor as unknown as ShortcutEditor
        const { $from } = editor.state.selection
        const text = $from.parent.textContent
        const start = $from.start()

        if (/^\[ \]$/.test(text)) {
          if (!editor.commands.deleteRange({ from: start, to: $from.pos })) return false
          return editor.commands.toggleTaskList()
        }

        if (/^---$/.test(text)) {
          if (!editor.commands.deleteRange({ from: start, to: $from.pos })) return false
          return editor.commands.setHorizontalRule()
        }

        return false
      },
    }
  },
})
