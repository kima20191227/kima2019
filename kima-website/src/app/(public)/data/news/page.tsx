import { redirect } from 'next/navigation'

// /data/news → /network/news 로 영구 리다이렉트
export default function DataNewsRedirect() {
  redirect('/network/news')
}
