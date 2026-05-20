import { prisma } from '@/lib/prisma'
import { DirectoryClient } from './DirectoryClient'

export const revalidate = 300 // 5분 캐싱 (단체 목록은 자주 바뀌지 않음)

export default async function DirectoryPage() {
  const initialOrgs = await prisma.organization.findMany({
    where: { isPublic: true },
    orderBy: { name: 'asc' },
  }).catch(() => [])

  return <DirectoryClient initialOrgs={initialOrgs} />
}
