import { describe, expect, it } from 'vitest'
import {
  MAX_RESOURCE_FILE_SIZE_BYTES,
  MAX_RESOURCE_FILE_SIZE_MB,
  normalizedResourceMimeType,
} from '@/lib/resourceUploadPolicy'

describe('resourceUploadPolicy', () => {
  it('keeps the resource upload limit at 100MB', () => {
    expect(MAX_RESOURCE_FILE_SIZE_MB).toBe(100)
    expect(MAX_RESOURCE_FILE_SIZE_BYTES).toBe(100 * 1024 * 1024)
  })

  it('infers common document MIME types when browsers send octet-stream', () => {
    expect(normalizedResourceMimeType({ name: 'guide.pdf', type: 'application/octet-stream' }))
      .toBe('application/pdf')
    expect(normalizedResourceMimeType({ name: 'slides.pptx', type: 'application/octet-stream' }))
      .toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation')
    expect(normalizedResourceMimeType({ name: 'manual.hwp', type: '' }))
      .toBe('application/x-hwp')
  })

  it('rejects unsupported file extensions', () => {
    expect(normalizedResourceMimeType({ name: 'archive.exe', type: 'application/octet-stream' }))
      .toBeNull()
  })
})
