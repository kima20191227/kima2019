/**
 * 주요 언론사(기독교 언론 포함) 뉴스 소스 등록.
 * '오늘의 주요 뉴스' 코너(src/lib/majorNewsOutlets.ts)를 채우는 직접 수집 소스다.
 * 조선·중앙·동아 등 종합지는 네이버 뉴스 검색 소스로 이미 들어오므로 여기서는
 * 네이버로 잘 안 잡히는 기독교 언론을 직접 수집한다.
 *
 * - 국민일보: 섹션 RSS에 '더미션'(교계) 피드가 비어 있어, 전 섹션 최근 48시간을
 *   담은 구글 뉴스 사이트맵을 쓴다. 사이트맵은 제목만 있으므로 키워드는 제목에 걸리고,
 *   요약은 수집 후 기사 본문에서 보강된다.
 * - CTS: robots.txt 가 검색엔진 외 봇을 모두 차단하고 뉴스 RSS가 없어 제외.
 *
 * 수집된 기사는 이후 관련성 필터(newsMissionRelevance)를 한 번 더 거친다.
 *
 * 실행: npm run news:seed-press-sources
 */
import { prisma } from '@/lib/prisma'

const MIGRATION_KEYWORDS = [
  '다문화', '이주민', '이주노동', '이주배경', '이주여성', '외국인', '난민', '이민',
  '유학생', '결혼이민', '고려인', '탈북', '미등록', '고용허가', '출입국',
]

const PRESS_SOURCES = [
  {
    name: '국민일보',
    url: 'https://www.kmib.co.kr',
    rssUrl: 'https://www.kmib.co.kr/rss/data/sitemap/recentArticlelist.xml',
    order: 15,
  },
  {
    name: '크리스천투데이',
    url: 'https://www.christiantoday.co.kr',
    rssUrl: 'https://www.christiantoday.co.kr/rss/articles/topnews/all.rss',
    order: 16,
  },
  {
    name: '기독일보',
    url: 'https://www.christiandaily.co.kr',
    rssUrl: 'https://www.christiandaily.co.kr/rss/articles/topnews/all.rss',
    order: 17,
  },
  {
    name: '뉴스앤조이',
    url: 'https://www.newsnjoy.or.kr',
    rssUrl: 'https://www.newsnjoy.or.kr/rss/allArticle.xml',
    order: 18,
  },
  {
    name: 'CBS노컷뉴스 — 사회',
    url: 'https://www.nocutnews.co.kr',
    rssUrl: 'https://rss.nocutnews.co.kr/category/society.xml',
    order: 19,
  },
]

async function main() {
  for (const { name, ...rest } of PRESS_SOURCES) {
    const data = {
      ...rest,
      apiType: 'rss',
      keywords: MIGRATION_KEYWORDS,
      defaultCategory: 'OTHER',
      isEnabled: true,
    }
    await prisma.newsSource.upsert({
      where: { name },
      update: data,
      create: { name, ...data },
    })
    console.log(`upserted: ${name}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
