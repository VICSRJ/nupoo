import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { MarkdownShortcuts } from './markdown-shortcuts'

const lowlight = createLowlight(common)

export const createEditorExtensions = () => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    codeBlock: false,
  }),
  Placeholder.configure({ placeholder: 'Napiš něco… / pro příkazy' }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Highlight.configure({ multicolor: false }),
  Typography,
  Underline,
  Link.configure({
    autolink: true,
    linkOnPaste: true,
    openOnClick: false,
  }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  CodeBlockLowlight.configure({
    lowlight,
    defaultLanguage: 'plaintext',
    enableTabIndentation: true,
    tabSize: 2,
  }),
  MarkdownShortcuts,
]
