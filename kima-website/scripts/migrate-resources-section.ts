import { prisma } from '../kima-website/src/lib/prisma'

async function main() {
  const result = await prisma.resource.updateMany({
    where: { section: 'PUBLIC' },
    data: { section: 'MINISTRY' },
  })
  console.log(`Updated ${result.count} resources: section PUBLIC → MINISTRY`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
