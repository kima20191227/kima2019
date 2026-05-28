import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const rows = await prisma.resource.groupBy({
  by: ['section', 'accessLevel'],
  _count: { _all: true },
  orderBy: [{ section: 'asc' }, { accessLevel: 'asc' }],
})

console.log('\n=== Resource 분포 (section × accessLevel) ===')
console.table(rows.map(r => ({ section: r.section, accessLevel: r.accessLevel, count: r._count._all })))

const total = await prisma.resource.count()
console.log(`\n총 자료 수: ${total}개`)

await prisma.$disconnect()
