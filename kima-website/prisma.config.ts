import { defineConfig } from 'prisma/config'
import { loadEnvConfig } from '@next/env'

// .env.local을 Next.js 방식으로 로드 (prisma CLI는 .env.local을 자동으로 읽지 않음)
loadEnvConfig(process.cwd())

export default defineConfig({
  migrations: {
    seed: 'node --env-file=.env.local --require tsx/cjs prisma/seed.ts',
  },
  datasource: {
    // CLI(db push 등)는 세션 모드 풀러(5432)로 직접 연결 — DDL 지원
    // 런타임 클라이언트(src/lib/prisma.ts)는 DATABASE_URL을 직접 읽으므로 영향 없음
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
  },
})
