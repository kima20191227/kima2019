/**
 * KIMA 앱 자리표시자 아이콘/스플래시 생성 스크립트
 *
 * 의존성 없음 — Node.js 내장 모듈(fs, zlib)만 사용
 * 실행: node generate-assets.js
 *
 * !! 실제 디자인 파일로 교체 필요 !!
 * 디자이너가 제공한 파일로 assets/images/ 내 PNG를 덮어쓰세요.
 */

'use strict'

const fs   = require('fs')
const path = require('path')
const zlib = require('zlib')

// ─── 출력 디렉토리 ─────────────────────────────────────────────────────────────

const OUT_DIR = path.join(__dirname, 'assets', 'images')
fs.mkdirSync(OUT_DIR, { recursive: true })

// ─── CRC32 계산 (PNG 청크 무결성) ─────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function u32be(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n >>> 0)
  return b
}

// ─── 청크 빌더 ────────────────────────────────────────────────────────────────

function chunk(typeStr, data) {
  const type = Buffer.from(typeStr, 'ascii')
  const body = data ? Buffer.concat([type, data]) : type
  return Buffer.concat([u32be(data ? data.length : 0), type, ...(data ? [data] : []), u32be(crc32(body))])
}

// ─── PNG 인코더 (단색 RGB) ────────────────────────────────────────────────────

function encodePng(width, height, r, g, b) {
  // PNG 서명
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width,  0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8]  = 8 // bit depth
  ihdr[9]  = 2 // color type: RGB
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // 픽셀 데이터 (각 행 앞에 filter byte 0 = None)
  const rowLen = 1 + width * 3
  const raw    = Buffer.alloc(height * rowLen, 0)
  for (let y = 0; y < height; y++) {
    const off = y * rowLen
    raw[off] = 0 // filter type: None
    for (let x = 0; x < width; x++) {
      raw[off + 1 + x * 3]     = r
      raw[off + 1 + x * 3 + 1] = g
      raw[off + 1 + x * 3 + 2] = b
    }
  }

  // IDAT (deflate 압축 — 단색이므로 극히 작아짐)
  const compressed = zlib.deflateSync(raw, { level: 9 })

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND'),
  ])
}

// ─── 생성 대상 정의 ───────────────────────────────────────────────────────────
// 색상 : #1B3A6B (KIMA 네이비)
const NAVY  = [0x1B, 0x3A, 0x6B]
// 흰색 알림 아이콘 배경 (투명 PNG는 이 스크립트에서 미지원 → 흰색으로 대체)
const WHITE = [0xFF, 0xFF, 0xFF]
// adaptive-icon은 투명 배경이 필요하나 자리표시자로 네이비 사용
const TRANS = [0x1B, 0x3A, 0x6B]

const ASSETS = [
  // [파일명,               가로,  세로, r,        g,        b,        설명           ]
  ['icon.png',              1024,  1024, ...NAVY,  '앱 아이콘 (1024×1024)'],
  ['adaptive-icon.png',     1024,  1024, ...TRANS, 'Adaptive 아이콘 전경 (1024×1024) — 투명 배경으로 교체 필요'],
  ['splash.png',            1284,  2778, ...NAVY,  '스플래시 화면 (1284×2778)'],
  ['notification-icon.png',   96,    96, ...WHITE, 'Android 알림 아이콘 (96×96 흰색)'],
  ['favicon.png',             48,    48, ...NAVY,  '웹 파비콘 (48×48)'],
]

// ─── 생성 실행 ────────────────────────────────────────────────────────────────

console.log('KIMA 자리표시자 에셋 생성 중...\n')

for (const [file, w, h, r, g, b, desc] of ASSETS) {
  const outPath = path.join(OUT_DIR, file)
  const buf = encodePng(w, h, r, g, b)
  fs.writeFileSync(outPath, buf)
  console.log(`  ✅  ${file.padEnd(24)} (${w}×${h})  ${desc}`)
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  실제 디자인 파일로 교체하세요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  assets/images/icon.png              → 1024×1024 (네이비 배경 + KIMA 로고)
  assets/images/adaptive-icon.png    → 1024×1024 (투명 배경, 로고만)
  assets/images/splash.png           → 1284×2778 (네이비 배경 + 중앙 로고)
  assets/images/notification-icon.png → 96×96 (흰색 단색 아이콘)

  디자인 가이드: CI 색상 #1B3A6B (네이비) / #C8922A (골드)
`)
