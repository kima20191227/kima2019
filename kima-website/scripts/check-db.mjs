/* global console, process */

import { existsSync, readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function loadEnvFile(path) {
  if (!existsSync(path)) return

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]] !== undefined) continue

    const rawValue = match[2].trim()
    process.env[match[1]] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 })
const prisma = new PrismaClient({ adapter })

try {
  const rows = await prisma.resource.groupBy({
    by: ['section', 'accessLevel'],
    _count: { _all: true },
    orderBy: [{ section: 'asc' }, { accessLevel: 'asc' }],
  })

  console.log('\n=== Resource distribution by section and accessLevel ===')
  console.table(rows.map((row) => ({
    section: row.section,
    accessLevel: row.accessLevel,
    count: row._count._all,
  })))

  const total = await prisma.resource.count()
  console.log(`\nTotal resources: ${total}`)
} finally {
  await prisma.$disconnect()
}
