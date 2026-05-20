import sharp from 'sharp'

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'image/heic', 'image/heif', 'image/bmp', 'image/tiff',
])

export function isConvertibleImage(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.has(mimeType)
}

/**
 * 이미지 버퍼를 WebP로 변환한다. 긴 쪽이 maxSize px을 넘으면 리사이즈도 함께 처리.
 * image/webp 와 image/gif 는 변환만, 나머지는 quality 80 적용.
 */
export async function convertToWebP(
  buffer: Buffer,
  mimeType: string,
  maxSize = 1920,
): Promise<{ buffer: Buffer<ArrayBuffer>; contentType: 'image/webp'; ext: 'webp' }> {
  const pipeline = sharp(buffer).resize(maxSize, maxSize, {
    fit: 'inside',
    withoutEnlargement: true,
  })

  const raw = await pipeline.webp({ quality: 80 }).toBuffer()
  const ab  = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer
  const result = Buffer.from(ab) as Buffer<ArrayBuffer>

  return { buffer: result, contentType: 'image/webp', ext: 'webp' }
}
