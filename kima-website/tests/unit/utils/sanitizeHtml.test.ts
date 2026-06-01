import { describe, expect, it } from 'vitest'
import { sanitizeRichHtml } from '@/lib/sanitizeHtml'

describe('sanitizeRichHtml', () => {
  it('removes script blocks and event attributes', () => {
    expect(sanitizeRichHtml('<p onclick="alert(1)">safe</p><script>alert(1)</script>')).toBe('<p>safe</p>')
  })

  it('removes unsafe url attributes with quoted or unquoted values', () => {
    expect(sanitizeRichHtml('<a href=javascript:alert(1)>x</a>')).toBe('<a>x</a>')
    expect(sanitizeRichHtml('<img src="javascript:alert(1)">')).toBe('<img>')
    expect(sanitizeRichHtml('<a href="java\nscript:alert(1)">x</a>')).toBe('<a>x</a>')
  })

  it('keeps safe links and normalizes attributes to quoted values', () => {
    expect(sanitizeRichHtml('<a href=https://kima2019.org>kima</a>')).toBe('<a href="https://kima2019.org">kima</a>')
  })
})
