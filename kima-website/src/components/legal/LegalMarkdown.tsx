import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface LegalMarkdownProps {
  content: string
}

export function LegalMarkdown({ content }: LegalMarkdownProps) {
  return (
    <div
      className="prose prose-sm sm:prose-base max-w-none
        prose-headings:text-[#1B3A6B] prose-headings:font-bold
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900
        prose-table:text-sm prose-th:bg-gray-50 prose-th:text-gray-700
        prose-td:align-top prose-blockquote:border-[#C8922A]
        prose-blockquote:bg-amber-50/50 prose-blockquote:px-4 prose-blockquote:py-1
        prose-code:text-[#1B3A6B] prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
