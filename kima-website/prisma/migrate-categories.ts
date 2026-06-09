/**
 * 카테고리 통폐합 마이그레이션
 *
 * 실행: npx tsx prisma/migrate-categories.ts
 *
 * 변경 내용:
 * - '결혼이민자' + '다문화자녀' → '다문화가정' 으로 통폐합
 * - '난민미등록' → '난민' 으로 이름 변경
 * - 관련 Post, Resource, Organization.targets 배열 일괄 업데이트
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('=== 카테고리 마이그레이션 시작 ===')

  // 1. '다문화자녀' (slug: children) → '다문화가정'
  const childrenUpdated = await prisma.category.updateMany({
    where: { slug: 'children' },
    data: { name: '다문화가정', order: 3 },
  })
  console.log(`✓ 다문화자녀 → 다문화가정: ${childrenUpdated.count}건`)

  // 2. '난민미등록' (slug: refugee) → '난민'
  const refugeeUpdated = await prisma.category.updateMany({
    where: { slug: 'refugee' },
    data: { name: '난민', order: 4 },
  })
  console.log(`✓ 난민미등록 → 난민: ${refugeeUpdated.count}건`)

  // 3. '귀국이주민' 순서 조정
  await prisma.category.updateMany({
    where: { slug: 'returnee' },
    data: { order: 5 },
  })
  console.log('✓ 귀국이주민 order → 5')

  // 4. '결혼이민자' (slug: marriage) → '다문화가정'으로 게시물·자료 이전 후 삭제
  const marriageCategory = await prisma.category.findFirst({ where: { slug: 'marriage' } })
  const childrenCategory = await prisma.category.findFirst({ where: { slug: 'children' } })

  if (marriageCategory) {
    if (childrenCategory) {
      const postsMoved = await prisma.post.updateMany({
        where: { categoryId: marriageCategory.id },
        data: { categoryId: childrenCategory.id },
      })
      const resourcesMoved = await prisma.resource.updateMany({
        where: { categoryId: marriageCategory.id },
        data: { categoryId: childrenCategory.id },
      })
      console.log(`✓ 결혼이민자 게시글 → 다문화가정 이전: ${postsMoved.count}건`)
      console.log(`✓ 결혼이민자 자료 → 다문화가정 이전: ${resourcesMoved.count}건`)
    }

    await prisma.category.delete({ where: { id: marriageCategory.id } })
    console.log('✓ 결혼이민자 카테고리 삭제 완료')
  } else {
    console.log('— 결혼이민자 카테고리 없음 (이미 삭제되었거나 미생성)')
  }

  // 5. Organization.targets 배열에서 구 명칭 → 신 명칭 일괄 교체
  const orgsToUpdate = await prisma.organization.findMany({
    where: {
      targets: { hasSome: ['결혼이민자', '다문화자녀', '난민미등록'] },
    },
    select: { id: true, targets: true },
  })

  let orgUpdatedCount = 0
  for (const org of orgsToUpdate) {
    const updatedTargets = [...new Set(
      org.targets.map((t) => {
        if (t === '결혼이민자' || t === '다문화자녀') return '다문화가정'
        if (t === '난민미등록') return '난민'
        return t
      })
    )]
    await prisma.organization.update({
      where: { id: org.id },
      data: { targets: updatedTargets },
    })
    orgUpdatedCount++
  }
  console.log(`✓ Organization.targets 업데이트: ${orgUpdatedCount}건`)

  console.log('=== 마이그레이션 완료 ===')
}

main()
  .catch((err) => {
    console.error('마이그레이션 실패:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
