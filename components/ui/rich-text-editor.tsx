'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import styles from './rich-text-editor.module.css'

type RichTextEditorProps = {
  minHeight?: number
  onChange: (html: string) => void
  placeholder?: string
  value: string
}

export default function RichTextEditor({
  minHeight = 120,
  onChange,
  placeholder,
  value,
}: RichTextEditorProps) {
  const editor = useEditor({
    content: value,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        strike: false,
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getHTML())
    },
  })

  // Sync external value changes (e.g. when switching audience tabs)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return

    const currentHtml = editor.getHTML()
    // Only update if the external value actually changed
    // (avoid cursor-position reset on every keystroke)
    if (currentHtml !== value) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) return null

  const btn = (
    isActive: boolean,
    onClick: () => void,
    label: string,
    style?: React.CSSProperties
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={isActive ? styles.toolbarButtonActive : styles.toolbarButton}
      style={style}
    >
      {label}
    </button>
  )

  return (
    <div className={styles.editorWrapper}>
      {/* Fixed toolbar */}
      <div className={styles.toolbar}>
        {btn(
          editor.isActive('bold'),
          () => editor.chain().focus().toggleBold().run(),
          'B',
          { fontWeight: 700, fontSize: 13 }
        )}
        {btn(
          editor.isActive('italic'),
          () => editor.chain().focus().toggleItalic().run(),
          'I',
          { fontStyle: 'italic', fontSize: 13 }
        )}
        {btn(
          editor.isActive('bulletList'),
          () => editor.chain().focus().toggleBulletList().run(),
          '•—',
          { fontSize: 12 }
        )}
        {btn(
          editor.isActive('orderedList'),
          () => editor.chain().focus().toggleOrderedList().run(),
          '1.',
          { fontSize: 12 }
        )}
        <div className={styles.separator} />
        {btn(
          false,
          () => editor.chain().focus().unsetAllMarks().run(),
          '✕',
          { fontSize: 11, color: '#4E576A' }
        )}
      </div>

      {/* Content area */}
      <div
        className={styles.contentArea}
        style={{ minHeight }}
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
