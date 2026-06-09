// 일회성 임포트 스크립트: d:\Ai_aigent\data_search\output\kima_upload.json
// 실행: npx tsx --env-file=.env.local prisma/import-kima-upload.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as fs from 'fs'

const rawData = fs.readFileSync('d:/Ai_aigent/data_search/output/kima_upload.json', 'utf-8')
  .replace(/^﻿/, '')  // BOM 제거
const data = JSON.parse(rawData)

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 1 })
const prisma = new PrismaClient({ adapter } as any)

// ── 매핑 테이블 ────────────────────────────────────────────

const TYPE_MAP: Record<string, string> = {
  '교회': '교회',
  '선교단체': '선교단체',
  '복지기관': 'NGO',
  '재단/협회': 'NGO',
  '교육기관': '교육',
}

const LANG_MAP: Record<string, string> = {
  '영어': '영어',
  '중국어': '중국&동포',
  '일본어': '일본어',
  '몽골어': '몽골어',
  '필리핀어': '필리핀어',
  '베트남어': '베트남어',
  '러시아어': '러시아어',
  '캄보디아어': '캄보디아어',
  '네팔어': '네팔어',
  '태국어': '태국어',
  '스리랑카어': '스리랑카어',
  '미얀마어': '미얀마어',
  '아랍어': '아랍어',
  '라오스어': '라오스어',
  '힌디어': '힌디어',
  '기타': '기타',
}

const TARGET_MAP: Record<string, string> = {
  '이주민': '이주노동자',
  '노동자': '이주노동자',
  '유학생': '유학생',
  '다문화가정': '다문화가정',
  '난민': '난민',
  '기타': '기타',
}

const REGION_MAP: Record<string, string> = {
  '서울특별시': '서울',
  '경기도': '경기',
  '인천광역시': '인천',
  '부산광역시': '부산경남',
  '울산광역시': '부산경남',
  '경상남도': '부산경남',
  '대구광역시': '대구경북',
  '경상북도': '대구경북',
  '광주광역시': '광주전라',
  '전라남도': '광주전라',
  '전라북도': '광주전라',
  '전북특별자치도': '광주전라',
  '대전광역시': '대전충청',
  '충청남도': '대전충청',
  '충청북도': '대전충청',
  '세종특별자치시': '대전충청',
  '강원도': '강원',
  '강원특별자치도': '강원',
  '제주특별자치도': '제주',
  '제주도': '제주',
}

function mapLanguages(raw: string): string[] {
  if (!raw) return ['기타']
  const result = new Set<string>()
  for (const part of raw.split(/[,·，]+/).map((s) => s.trim())) {
    const base = part.replace(/\s*\(.*?\)/, '').trim()
    const mapped = LANG_MAP[base] ?? (base ? '기타' : null)
    if (mapped) result.add(mapped)
  }
  return result.size > 0 ? [...result] : ['기타']
}

function mapTargets(raw: string): string[] {
  if (!raw) return ['기타']
  const result = new Set<string>()
  for (const part of raw.split(/[,，]+/).map((s) => s.trim())) {
    const mapped = TARGET_MAP[part]
    if (mapped) result.add(mapped)
  }
  return result.size > 0 ? [...result] : ['기타']
}

function mapRegion(sido: string): string {
  return REGION_MAP[sido?.trim()] ?? '기타'
}

function mapRepresentative(raw: string): string | null {
  if (!raw || raw === '불명' || raw === '담임목사 (성함 미확인)') return null
  return raw
}

// ── 임포트 실행 ────────────────────────────────────────────

async function main() {
  const items = data as any[]
  let created = 0
  let skipped = 0

  for (const item of items) {
    const name: string = item['단체명']?.trim()
    if (!name) { skipped++; continue }

    // 이미 존재하면 스킵 (name 기준)
    const existing = await prisma.organization.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    })
    if (existing) {
      console.log(`⏭  스킵 (이미 존재): ${name}`)
      skipped++
      continue
    }

    const introLines: string[] = []
    const serviceTime: string = item['예배시간']?.trim()
    if (serviceTime) introLines.push(`예배시간: ${serviceTime}`)

    await prisma.organization.create({
      data: {
        name,
        representative: mapRepresentative(item['대표자_직분']),
        description: item['사역소개']?.trim() || null,
        region: mapRegion(item['시도']),
        type: TYPE_MAP[item['기관유형']] ?? '기타',
        languages: mapLanguages(item['사역민족_언어']),
        targets: mapTargets(item['사역대상']),
        phone: item['전화']?.trim() || null,
        website: item['홈페이지']?.trim() || null,
        address: item['주소']?.trim() || null,
        introLines,
        isPublic: item['검증상태'] === '확인됨',
        source: 'direct',
      },
    })
    console.log(`✅ 등록: ${name}`)
    created++
  }

  console.log(`\n완료: ${created}개 등록, ${skipped}개 스킵`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
