import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { HeaderClient } from './HeaderClient'

export async function Header() {
  const session = await auth()
  const user = session?.user
    ? { name: session.user.name, email: session.user.email, role: session.user.role }
    : null

  return (
    <header className="sticky top-0 z-[1200] bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 flex-wrap">

          {/* Logo — 서버에서 렌더, JS 불필요 */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/images/kima-logo.png"
              alt="KIMA 한국이주민선교연합회"
              width={160}
              height={56}
              className="h-14 w-auto"
              priority
            />
          </Link>

          {/* 인터랙티브 영역 (nav + auth + mobile) — 클라이언트 */}
          <HeaderClient user={user} />
        </div>
      </div>
    </header>
  )
}
