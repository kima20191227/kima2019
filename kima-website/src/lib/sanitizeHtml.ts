const DANGEROUS_BLOCKS =
  /<\s*(script|style|iframe|object|embed|template|svg|math)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi
const DANGEROUS_TAGS =
  /<\/?\s*(script|style|iframe|object|embed|template|svg|math|link|meta|base|form|input|button|textarea|select|option)\b[^>]*>/gi
const EVENT_ATTRIBUTES = /\s+on[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi
const UNSAFE_URL_ATTRIBUTES =
  /\s+(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
const STYLE_ATTRIBUTE = /\s+style\s*=\s*(["'])(.*?)\1/gi
const UNSAFE_URL_PROTOCOLS = /^(javascript:|vbscript:|data:)/i

function sanitizeStyle(style: string): string {
  const safeDeclarations = style
    .split(';')
    .map((part) => part.trim())
    .filter((part) =>
      /^(color|background-color):\s*#[0-9a-f]{3,8}$/i.test(part) ||
      /^font-size:\s*(14|16|18|20|24|28|32)px$/i.test(part) ||
      /^text-align:\s*(left|center|right|justify)$/i.test(part)
    )

  return safeDeclarations.join('; ')
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function sanitizeUrlAttribute(attribute: string, value: string): string {
  const normalized = value.replace(/[\u0000-\u001f\u007f\s]+/g, '').toLowerCase()
  if (UNSAFE_URL_PROTOCOLS.test(normalized)) return ''
  return ` ${attribute.toLowerCase()}="${escapeAttribute(value.trim())}"`
}

export function sanitizeRichHtml(html: string): string {
  return html
    .replace(DANGEROUS_BLOCKS, '')
    .replace(DANGEROUS_TAGS, '')
    .replace(EVENT_ATTRIBUTES, '')
    .replace(
      UNSAFE_URL_ATTRIBUTES,
      (_match, attribute: string, doubleQuoted: string | undefined, singleQuoted: string | undefined, unquoted: string | undefined) =>
        sanitizeUrlAttribute(attribute, doubleQuoted ?? singleQuoted ?? unquoted ?? ''),
    )
    .replace(STYLE_ATTRIBUTE, (_match, _quote, style: string) => {
      const safeStyle = sanitizeStyle(style)
      return safeStyle ? ` style="${safeStyle}"` : ''
    })
}
