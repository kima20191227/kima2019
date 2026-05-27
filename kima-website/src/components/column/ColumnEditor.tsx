'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { useEffect, useState } from 'react'

// Extends TextStyle to support fontSize without requiring Tiptap Pro
const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: ({ fontSize }) => {
          if (!fontSize) return {}
          return { style: `font-size: ${fontSize}` }
        },
      },
    }
  },
})

const FONT_SIZES = ['14px', '16px', '18px', '20px', '24px', '28px', '32px']

interface Props {
  content: string
  onChange: (html: string) => void
}

export function ColumnEditor({ content, onChange }: Props) {
  const [imageUrl, setImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomTextStyle,
      Color.configure({ types: ['textStyle'] }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: '칼럼 내용을 작성해주세요...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[300px] p-4 focus:outline-none',
      },
    },
    immediatelyRender: false,
  })

  // sync external content changes (edit mode initial load)
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content)
    }
    // only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!editor) return null

  const currentColor = editor.getAttributes('textStyle').color as string | undefined
  const currentSize = editor.getAttributes('textStyle').fontSize as string | undefined

  function handleInsertImage() {
    const trimmed = imageUrl.trim()
    if (!trimmed) return
    editor!.chain().focus().setImage({ src: trimmed }).run()
    setImageUrl('')
    setShowImageInput(false)
  }

  function handleSetFontSize(size: string) {
    if (!size) {
      editor!.chain().focus().setMark('textStyle', { fontSize: null }).run()
    } else {
      editor!.chain().focus().setMark('textStyle', { fontSize: size }).run()
    }
  }

  const btnBase =
    'px-2 py-1 rounded text-sm border border-gray-200 hover:bg-gray-100 transition-colors'
  const btnActive = 'bg-[#1B3A6B] text-white border-[#1B3A6B]'

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${btnBase} font-bold ${editor.isActive('bold') ? btnActive : ''}`}
          title="굵게"
        >
          B
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        {/* H2 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${btnBase} ${editor.isActive('heading', { level: 2 }) ? btnActive : ''}`}
          title="제목 2"
        >
          H2
        </button>

        {/* H3 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${btnBase} ${editor.isActive('heading', { level: 3 }) ? btnActive : ''}`}
          title="제목 3"
        >
          H3
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        {/* Align Left */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`${btnBase} ${editor.isActive({ textAlign: 'left' }) ? btnActive : ''}`}
          title="왼쪽 정렬"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h12M3 18h15" />
          </svg>
        </button>

        {/* Align Center */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`${btnBase} ${editor.isActive({ textAlign: 'center' }) ? btnActive : ''}`}
          title="가운데 정렬"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M6 12h12M4 18h16" />
          </svg>
        </button>

        {/* Align Right */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`${btnBase} ${editor.isActive({ textAlign: 'right' }) ? btnActive : ''}`}
          title="오른쪽 정렬"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M9 12h12M6 18h15" />
          </svg>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        {/* Text color */}
        <label className="flex items-center gap-1 cursor-pointer" title="글자 색상">
          <span className="text-xs text-gray-600">색상</span>
          <input
            type="color"
            value={currentColor || '#000000'}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-7 h-7 rounded cursor-pointer border border-gray-200 p-0.5"
          />
        </label>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        {/* Font size */}
        <select
          value={currentSize || ''}
          onChange={(e) => handleSetFontSize(e.target.value)}
          className="text-sm border border-gray-200 rounded px-1 py-1 bg-white"
          title="글자 크기"
        >
          <option value="">크기</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s.replace('px', '')}
            </option>
          ))}
        </select>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        {/* Image insert */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowImageInput((v) => !v)}
            className={`${btnBase} ${showImageInput ? btnActive : ''}`}
            title="이미지 삽입"
          >
            이미지
          </button>
          {showImageInput && (
            <div className="absolute left-0 top-full mt-1 z-10 flex gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-72">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInsertImage()}
                placeholder="이미지 URL 입력"
                className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
                autoFocus
              />
              <button
                type="button"
                onClick={handleInsertImage}
                className="px-2 py-1 text-sm bg-[#1B3A6B] text-white rounded"
              >
                삽입
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:mb-1 [&_.ProseMirror_p]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded [&_.ProseMirror_.is-editor-empty:before]:content-[attr(data-placeholder)] [&_.ProseMirror_.is-editor-empty:before]:text-gray-400 [&_.ProseMirror_.is-editor-empty:before]:float-left [&_.ProseMirror_.is-editor-empty:before]:pointer-events-none"
      />
    </div>
  )
}
