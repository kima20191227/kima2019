import { auth } from '@/lib/auth'
import { getGrantedAdminMenus } from '@/lib/adminAccess'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import type { Metadata } from 'next'
import type { UserRole } from '@prisma/client'

export const metadata: Metadata = { title: '관리 | KIMA' }

const ROLE_HIERARCHY = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 } as const

function hasRole(role: string, required: keyof typeof ROLE_HIERARCHY) {
  return (ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] ?? 0) >= ROLE_HIERARCHY[required]
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = session?.user?.role as UserRole | undefined

  if (!role || !hasRole(role, 'OFFICER')) {
    redirect('/')
  }

  const grantedMenus = role === 'OFFICER' ? await getGrantedAdminMenus(session) : []

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar userRole={role} grantedMenus={grantedMenus} />
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
