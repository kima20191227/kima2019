import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 1 })
const prisma = new PrismaClient({ adapter })

async function main() {
  const rows = await prisma.resource.groupBy({
    by: ['section', 'accessLevel'],
    _count: { _all: true },
    orderBy: [{ section: 'asc' }, { accessLevel: 'asc' }],
  })
  console.log('\n=== 자료 분포 ===')
  for (const r of rows) {
    console.log(`section=${r.section}, accessLevel=${r.accessLevel}, count=${r._count._all}`)
  }
  const total = await prisma.resource.count()
  console.log(`\n총: ${total}개`)
}

main().finally(() => prisma.$disconnect())
