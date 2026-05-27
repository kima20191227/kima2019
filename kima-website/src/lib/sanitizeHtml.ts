const DANGEROUS_BLOCKS =
  /<\s*(script|style|iframe|object|embed|template|svg|math)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi
const DANGEROUS_TAGS =
  /<\/?\s*(script|style|iframe|object|embed|template|svg|math|link|meta|base|form|input|button|textarea|select|option)\b[^>]*>/gi
const EVENT_ATTRIBUTES = /\s+on[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi
const UNSAFE_URL_ATTRIBUTES =
  /\s+(href|src)\s*=\s*(["'])\s*(javascript:|vbscript:|data:text\/html)[\s\S]*?\2/gi
const STYLE_ATTRIBUTE = /\s+style\s*=\s*(["'])(.*?)\1/gi

function sanitizeStyle(style: string): string {
  const safeDeclarations = style
    .split(';')
    .map((part) => part.trim())
    .filter((part) =>
      /^(color|background-color):\s*#[0-9a-f]{3,8}$/i.test(part) ||
      /^font-size:\s*(14|16|18|20|24|28|32)px$/i.test(part)
    )

  return safeDeclarations.join('; ')
}

export function sanitizeRichHtml(html: string): string {
  return html
    .replace(DANGEROUS_BLOCKS, '')
    .replace(DANGEROUS_TAGS, '')
    .replace(EVENT_ATTRIBUTES, '')
    .replace(UNSAFE_URL_ATTRIBUTES, '')
    .replace(STYLE_ATTRIBUTE, (_match, _quote, style: string) => {
      const safeStyle = sanitizeStyle(style)
      return safeStyle ? ` style="${safeStyle}"` : ''
    })
}
