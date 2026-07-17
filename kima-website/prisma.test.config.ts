import { defineConfig } from 'prisma/config'

// 로컬 테스트 DB 전용 설정 — 실서비스(.env.local)를 절대 읽지 않는다.
// prisma.config.ts와 달리 loadEnvConfig를 호출하지 않으므로 .env.local이 섞이지 않는다.
const TEST_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/kima_test'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: TEST_DATABASE_URL,
  },
})
