/**
 * 국민일보(kmib.co.kr) 뉴스 소스 등록.
 *
 * 왜 사이트맵인가:
 * - 국민일보 섹션 RSS(https://www.kmib.co.kr/rss)는 정치·사회 등 9개 섹션만 있고
 *   '더미션'(교계) 섹션 피드(kmibChrRss.xml)는 비어 있다. 이주민·다문화 사역 기사가
 *   가장 많이 실리는 곳이 바로 더미션이다.
 * - 구글 뉴스 사이트맵(recentArticlelist.xml)은 전 섹션의 최근 약 48시간 기사를
 *   담고 있어, 하루 1회 수집으로도 빠짐없이 훑을 수 있다.
 * - 사이트맵에는 제목만 있으므로 키워드는 '제목'에 걸린다. 요약은 수집 후
 *   기사 본문에서 보강되고, 그 다음 관련성 필터를 한 번 더 거친다.
 *
 * 실행: npm run news:seed-kmib-source
 */
import { prisma } from '@/lib/prisma'

const KMIB_SOURCE = {
  name: '국민일보',
  url: 'https://www.kmib.co.kr',
  rssUrl: 'https://www.kmib.co.kr/rss/data/sitemap/recentArticlelist.xml',
  apiType: 'rss',
  keywords: [
    '다문화', '이주민', '이주노동', '이주배경', '이주여성', '외국인', '난민', '이민',
    '유학생', '결혼이민', '고려인', '탈북', '미등록', '고용허가', '출입국',
  ],
  defaultCategory: 'OTHER',
  order: 15,
}

async function main() {
  const { name, ...rest } = KMIB_SOURCE
  const source = await prisma.newsSource.upsert({
    where: { name },
    update: { ...rest, isEnabled: true },
    create: { ...KMIB_SOURCE, isEnabled: true },
  })
  console.log(JSON.stringify({ upserted: source.name, rssUrl: source.rssUrl }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
