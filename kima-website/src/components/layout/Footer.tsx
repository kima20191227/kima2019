import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-[#1B3A6B] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 단체 정보 */}
          <div>
            <h3 className="text-lg font-bold mb-3">KIMA</h3>
            <p className="text-sm text-blue-200 leading-relaxed">
              한국이주민선교연합회<br />
              Korea Immigrants Missions Association
            </p>
            <div className="mt-4 space-y-1 text-sm text-blue-200">
              <p>이메일: info@kima2019.org</p>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div>
            <h4 className="text-sm font-semibold text-blue-100 uppercase tracking-wider mb-3">바로가기</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link href="/about" className="hover:text-white transition-colors">단체 소개</Link></li>
              <li><Link href="/directory" className="hover:text-white transition-colors">국내 이주민 사역지도</Link></li>
              <li><Link href="/community" className="hover:text-white transition-colors">커뮤니티</Link></li>
              <li><Link href="/story" className="hover:text-white transition-colors">스토리</Link></li>
              <li><Link href="/donate" className="hover:text-white transition-colors">후원하기</Link></li>
            </ul>
          </div>

          {/* 정보 */}
          <div>
            <h4 className="text-sm font-semibold text-blue-100 uppercase tracking-wider mb-3">안내</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link href="/auth/register" className="hover:text-white transition-colors">회원가입</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">로그인</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">이용약관</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-blue-300">
            &copy; {new Date().getFullYear()} 한국이주민선교연합회 (KIMA). All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-blue-400 hover:text-blue-200 transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="text-xs text-blue-400 hover:text-blue-200 transition-colors">이용약관</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
