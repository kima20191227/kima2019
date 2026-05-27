import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeKoreanAddress } from '@/lib/normalizeKoreanAddress'
import path from 'path'
import fs from 'fs'

// Province(full name) → center lat/lng for jitter
const PROVINCE_LATLON: Record<string, [number, number]> = {
  서울특별시: [37.5665, 126.978],
  경기도: [37.4138, 127.5183],
  인천광역시: [37.4563, 126.7052],
  부산광역시: [35.1796, 129.0756],
  경상남도: [35.4606, 128.2132],
  대구광역시: [35.8714, 128.6014],
  경상북도: [36.4919, 128.8889],
  광주광역시: [35.1595, 126.8526],
  전라남도: [34.8679, 126.991],
  전북특별자치도: [35.7175, 127.153],
  대전광역시: [36.3504, 127.3845],
  충청남도: [36.5184, 126.8],
  충청북도: [36.6357, 127.4914],
  세종특별자치시: [36.48, 127.289],
  강원특별자치도: [37.8228, 128.1555],
  제주특별자치도: [33.4996, 126.5312],
  울산광역시: [35.5384, 129.3114],
}

// 사역구분 keywords → targets array
function parseTargets(raw: string): string[] {
  const val = (raw ?? '').toLowerCase()
  const result: string[] = []
  if (val.includes('노동자') || val.includes('이주노동')) result.push('이주노동자')
  if (val.includes('유학생')) result.push('유학생')
  if (val.includes('이주 가정') || val.includes('결혼') || val.includes('다문화가정')) result.push('결혼이민자')
  if (val.includes('자녀') || val.includes('다음세대') || val.includes('2세')) result.push('다문화자녀')
  if (val.includes('난민') || val.includes('미등록')) result.push('난민미등록')
  if (val.includes('귀국') || val.includes('탈북') || val.includes('동포')) result.push('귀국이주민')
  return result.length > 0 ? result : ['이주노동자']
}

// 사역대상국가 → languages array
function parseLanguages(raw: string): string[] {
  const val = (raw ?? '').toLowerCase()
  const result: string[] = []
  if (val.includes('베트남')) result.push('베트남')
  if (val.includes('네팔')) result.push('네팔')
  if (val.includes('몽골')) result.push('몽골')
  if (val.includes('인도네시아')) result.push('인도네시아')
  if (val.includes('필리핀')) result.push('필리핀')
  if (val.includes('러시아') || val.includes('중앙아')) result.push('러시아')
  if (val.includes('중국') || val.includes('대만') || val.includes('화교')) result.push('중국')
  if (val.includes('태국')) result.push('태국')
  if (val.includes('스리랑카') || val.includes('캄보디아') || val.includes('미얀마') ||
      val.includes('아랍') || val.includes('무슬림') || val.includes('파키스탄') ||
      val.includes('우즈벡') || val.includes('방글라') || val.includes('다국적') ||
      val.includes('다문화') || val.includes('한국') || val.includes('국내') ||
      val.includes('미정') || val.includes('아프') || val.includes('사우디')) {
    result.push('기타')
  }
  return result.length > 0 ? result : ['기타']
}

function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * 2 * range
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  try {
    // 기존 JSON 데이터 파일에서 로드
    const filePath = path.join(process.cwd(), 'public', 'orgs_data.json')
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'orgs_data.json 파일을 찾을 수 없습니다. public/orgs_data.json에 저장하세요.' }, { status: 404 })
    }

    interface OrgRow { name: string; address?: string; email?: string; phone?: string; nationRaw?: string; missionRaw?: string }
    const dataRows: OrgRow[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    let created = 0
    let skipped = 0

    for (const row of dataRows) {
      const name = String(row.name ?? '').trim()
      const address = String(row.address ?? '').trim()
      const email = String(row.email ?? '').trim()
      const phone = String(row.phone ?? '').trim()
      const nationRaw = String(row.nationRaw ?? '').trim()
      const missionRaw = String(row.missionRaw ?? '').trim()

      if (!name) { skipped++; continue }

      const normalized = normalizeKoreanAddress(address)
      const province = normalized.province ?? null
      const region = normalized.kimaRegion ?? '기타'
      const languages = parseLanguages(nationRaw)
      const targets = parseTargets(missionRaw)

      let lat: number | null = null
      let lng: number | null = null
      if (province && PROVINCE_LATLON[province]) {
        const [baseLat, baseLng] = PROVINCE_LATLON[province]
        lat = jitter(baseLat, 0.15)
        lng = jitter(baseLng, 0.25)
      }

      // Upsert by name to avoid duplicates on re-run
      const existing = await prisma.organization.findFirst({ where: { name } })
      if (existing) { skipped++; continue }

      await prisma.organization.create({
        data: {
          name,
          region,
          languages,
          targets,
          address: address || null,
          email: email.includes('@') ? email : null,
          phone: phone || null,
          lat,
          lng,
          isPublic: true,
        },
      })
      created++
    }

    return NextResponse.json({ ok: true, created, skipped, total: dataRows.length })
  } catch (err) {
    console.error('[seed-members]', err)
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
