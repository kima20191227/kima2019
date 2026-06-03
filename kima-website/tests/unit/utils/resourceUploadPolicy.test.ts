import { describe, expect, it } from 'vitest'
import {
  normalizedResourceMimeType,
} from '@/lib/resourceUploadPolicy'

describe('resourceUploadPolicy', () => {
  it('infers common document MIME types when browsers send octet-stream', () => {
    expect(normalizedResourceMimeType({ name: 'guide.pdf', type: 'application/octet-stream' }))
      .toBe('application/pdf')
    expect(normalizedResourceMimeType({ name: 'slides.pptx', type: 'application/octet-stream' }))
      .toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation')
    expect(normalizedResourceMimeType({ name: 'manual.hwp', type: '' }))
      .toBe('application/x-hwp')
  })

  it('allows unknown extensions as generic binary files', () => {
    expect(normalizedResourceMimeType({ name: 'archive.exe', type: 'application/octet-stream' }))
      .toBe('application/octet-stream')
    expect(normalizedResourceMimeType({ name: 'installer.exe', type: '' }))
      .toBe('application/octet-stream')
  })
})
