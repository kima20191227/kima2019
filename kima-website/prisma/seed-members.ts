/**
 * KIMA 정회원 일괄 등록 스크립트
 *
 * 실행 방법:
 *   npx tsx prisma/seed-members.ts
 *
 * 전제조건:
 *   - public/members_data.json 파일이 존재해야 합니다
 *   - DATABASE_URL 환경변수가 설정되어 있어야 합니다
 *
 * 초기 비밀번호: kima2019!  (회원들에게 변경 안내 필요)
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// .env.local 명시적 로드 (tsx 실행 시 자동 로드 안 됨)
config({ path: resolve(process.cwd(), '.env.local') })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { join } from 'path'

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const INITIAL_PASSWORD = 'kima123456'

interface MemberData {
  name: string
  email: string
  organization: string
  phone: string
  title: string
}

async function main() {
  console.log('▶ KIMA 정회원 일괄 등록 시작')

  const dataPath = join(process.cwd(), 'public', 'members_data.json')
  let members: MemberData[]
  try {
    members = JSON.parse(readFileSync(dataPath, 'utf-8'))
  } catch {
    console.error('❌ public/members_data.json 파일을 읽을 수 없습니다.')
    process.exit(1)
  }

  console.log(`📋 총 ${members.length}명 처리 예정`)

  const hashedPassword = await bcrypt.hash(INITIAL_PASSWORD, 12)

  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const stats = { created: 0, skipped: 0, failed: 0 }

  for (const member of members) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: member.email },
        select: { id: true },
      })

      if (existing) {
        stats.skipped++
        console.log(`  ⚠ 건너뜀: ${member.name} (${member.email}) — 이미 존재`)
        continue
      }

      await prisma.user.create({
        data: {
          name: member.name,
          email: member.email,
          organization: member.organization || undefined,
          phone: member.phone || undefined,
          role: 'PREMIUM',
          approvedAt: now,
          expiresAt,
          accounts: {
            create: {
              type: 'credentials',
              provider: 'credentials',
              providerAccountId: member.email,
              access_token: hashedPassword,
            },
          },
        },
      })

      stats.created++
      console.log(`  ✓ 등록: ${member.name} (${member.email})`)
    } catch (err) {
      stats.failed++
      console.error(`  ✗ 실패: ${member.name} (${member.email})`, err)
    }
  }

  console.log('\n─────────────────────────────')
  console.log(`✅ 등록 완료: ${stats.created}명`)
  console.log(`⚠  중복 건너뜀: ${stats.skipped}명`)
  console.log(`❌ 실패: ${stats.failed}명`)
  console.log('─────────────────────────────')
  console.log(`\n🔑 초기 비밀번호: ${INITIAL_PASSWORD}`)
  console.log('   → 관리자 메일 발송 기능으로 비밀번호 변경 안내를 발송하세요.')
  console.log('   → /admin/email 에서 전체 회원 대상 이메일을 보낼 수 있습니다.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
