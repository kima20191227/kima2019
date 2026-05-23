import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 카카오 지도 JS키 - NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수에서 읽음 (Cloudflare Pages 환경변수에 설정)
  env: {
    NEXT_PUBLIC_KAKAO_MAP_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? '',
  },
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536],
    imageSizes: [48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'www.genspark.ai',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'gmfsns.org',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // HSTS: 1년간 HTTPS 강제, 서브도메인 포함
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // CSP: frame-ancestors로 클릭재킹 방지 (X-Frame-Options보다 현대적)
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
        ],
      },
      {
        // 관리자 페이지 검색엔진 수집 차단
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
};

export default nextConfig;
