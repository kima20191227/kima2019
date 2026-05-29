import { prisma } from '@/lib/prisma'
import { ensureDefaultNewsCategories } from '@/lib/newsCategories'

const GOVERNMENT_NEWS_SOURCES = [
  {
    name: '정책브리핑 — 법제처',
    url: 'https://www.korea.kr',
    rssUrl: 'https://www.korea.kr/rss/dept_moleg.xml',
    apiType: 'rss',
    keywords: ['출입국', '체류', '비자', '외국인', '이민', '다문화', '유학생', '외국인근로자'],
    defaultCategory: 'LAW',
    order: 6,
  },
  {
    name: '정책브리핑 — 법무부',
    url: 'https://www.korea.kr',
    rssUrl: 'https://www.korea.kr/rss/dept_moj.xml',
    apiType: 'rss',
    keywords: ['출입국', '체류', '비자', '외국인', '이민', '난민', '다문화', '외국인정책'],
    defaultCategory: 'LAW',
    order: 7,
  },
  {
    name: '정책브리핑 — 국가데이터처',
    url: 'https://www.korea.kr',
    rssUrl: 'https://www.korea.kr/rss/dept_mods.xml',
    apiType: 'rss',
    keywords: ['외국인', '이민', '다문화', '이주민', '체류외국인', '국제이동', '외국인주민'],
    defaultCategory: 'STATISTICS',
    order: 8,
  },
  {
    name: '정책브리핑 — 정책자료',
    url: 'https://www.korea.kr',
    rssUrl: 'https://www.korea.kr/rss/expdoc.xml',
    apiType: 'rss',
    keywords: ['외국인', '이민', '다문화', '이주민', '체류', '유학생', '고용허가', '외국인주민'],
    defaultCategory: 'STATISTICS',
    order: 9,
  },
  {
    name: '생활법령정보 — 업데이트',
    url: 'https://www.easylaw.go.kr',
    rssUrl: 'https://www.easylaw.go.kr/CSP/RssNewRetrieve.laf?topMenu=serviceUl7',
    apiType: 'rss',
    keywords: ['외국인', '이민', '다문화', '체류', '비자', '근로자', '유학생', '난민'],
    defaultCategory: 'LAW',
    order: 10,
  },
  {
    name: '네이버 뉴스 — 법령·정책',
    url: 'https://news.naver.com',
    rssUrl: null,
    apiType: 'naver',
    keywords: ['법무부 외국인', '출입국 체류', '외국인 비자', '이민정책', '외국인정책'],
    defaultCategory: 'LAW',
    order: 13,
  },
  {
    name: '네이버 뉴스 — 통계·연구',
    url: 'https://news.naver.com',
    rssUrl: null,
    apiType: 'naver',
    keywords: ['통계청 외국인', '체류외국인 통계', '외국인주민 현황', '다문화 인구', '이민자 실태조사'],
    defaultCategory: 'STATISTICS',
    order: 14,
  },
]

const EXISTING_SOURCE_UPDATES = [
  {
    name: '네이버 뉴스 — 이주민',
    keywords: ['이주민 다문화', '이주민 외국인', '이주민 지원', '외국인주민', '이민자 사회통합'],
    defaultCategory: 'OTHER',
    order: 10,
  },
]

async function main() {
  await ensureDefaultNewsCategories()

  for (const source of EXISTING_SOURCE_UPDATES) {
    await prisma.newsSource.updateMany({
      where: { name: source.name },
      data: {
        keywords: source.keywords,
        defaultCategory: source.defaultCategory,
        order: source.order,
        isEnabled: true,
      },
    })
  }

  for (const source of GOVERNMENT_NEWS_SOURCES) {
    await prisma.newsSource.upsert({
      where: { name: source.name },
      update: {
        url: source.url,
        rssUrl: source.rssUrl,
        apiType: source.apiType,
        isEnabled: true,
        keywords: source.keywords,
        defaultCategory: source.defaultCategory,
        order: source.order,
      },
      create: {
        ...source,
        isEnabled: true,
      },
    })
  }

  console.log(JSON.stringify({
    updated: EXISTING_SOURCE_UPDATES.length,
    upserted: GOVERNMENT_NEWS_SOURCES.length,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
