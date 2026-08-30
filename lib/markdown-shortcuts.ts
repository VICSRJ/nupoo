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
        const from = $from.pos - text.length
        const deleteTrigger = (length: number) => editor.commands.deleteRange({ from: Math.max(start, $from.pos - length), to: $from.pos })

        if (/^\[ \]$/.test(text)) {
          deleteTrigger(3)
          return editor.commands.toggleTaskList()
        }

        if (/^---$/.test(text)) {
          deleteTrigger(3)
          return editor.commands.setHorizontalRule()
        }

        return from < start ? false : false
      },
    }
  },
})
