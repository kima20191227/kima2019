import { defineConfig } from 'prisma/config'
import { loadEnvConfig } from '@next/env'

// .env.local을 Next.js 방식으로 로드 (prisma CLI는 .env.local을 자동으로 읽지 않음)
loadEnvConfig(process.cwd())

export default defineConfig({
  migrations: {
    seed: 'node --env-file=.env.local --require tsx/cjs prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_DATABASE_URL,
  },
})
