import { PrismaClient, CategoryType, LeaderGroup } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const CATEGORIES: Array<{ type: CategoryType; name: string; slug: string; order: number }> = [
  // 지역별
  { type: 'REGION', name: '서울경기인천', slug: 'seoul', order: 1 },
  { type: 'REGION', name: '부산경남', slug: 'busan', order: 2 },
  { type: 'REGION', name: '대구경북', slug: 'daegu', order: 3 },
  { type: 'REGION', name: '광주전라', slug: 'gwangju', order: 4 },
  { type: 'REGION', name: '대전충청', slug: 'daejeon', order: 5 },
  { type: 'REGION', name: '강원제주', slug: 'gangwon', order: 6 },
  // 언어권별
  { type: 'LANGUAGE', name: '베트남', slug: 'vietnam', order: 1 },
  { type: 'LANGUAGE', name: '네팔', slug: 'nepal', order: 2 },
  { type: 'LANGUAGE', name: '몽골', slug: 'mongolia', order: 3 },
  { type: 'LANGUAGE', name: '인도네시아', slug: 'indonesia', order: 4 },
  { type: 'LANGUAGE', name: '필리핀', slug: 'philippines', order: 5 },
  { type: 'LANGUAGE', name: '러시아', slug: 'russia', order: 6 },
  { type: 'LANGUAGE', name: '중국', slug: 'china', order: 7 },
  { type: 'LANGUAGE', name: '태국', slug: 'thailand', order: 8 },
  { type: 'LANGUAGE', name: '기타', slug: 'others', order: 9 },
  // 사역대상별
  { type: 'TARGET', name: '이주노동자', slug: 'worker', order: 1 },
  { type: 'TARGET', name: '유학생', slug: 'student', order: 2 },
  { type: 'TARGET', name: '결혼이민자', slug: 'marriage', order: 3 },
  { type: 'TARGET', name: '다문화자녀', slug: 'children', order: 4 },
  { type: 'TARGET', name: '난민미등록', slug: 'refugee', order: 5 },
  { type: 'TARGET', name: '귀국이주민', slug: 'returnee', order: 6 },
]

type LeaderSeed = {
  group: LeaderGroup; title: string; name: string; org?: string
  position?: string; phone?: string; email?: string; nations?: string; mission?: string; order: number
}

const LEADERS: LeaderSeed[] = [
  // 고문·자문위원
  { group: 'ADVISOR', order: 1,  title: '고문',    name: '허명호', org: '월드네이버 대표',                       position: '목사/선교사', email: 'hur0121@naver.com',         nations: '200개국 이주민 사역',       mission: '노동자, 이주 가정' },
  { group: 'ADVISOR', order: 2,  title: '고문',    name: '정노화', org: '군포이주와다문화센터',                   position: '선교사',     phone: '010-3880-4980', email: 'pmf@naver.com', nations: '서울경기인천', mission: '이주노동자, 결혼이민자' },
  { group: 'ADVISOR', order: 3,  title: '자문위원', name: '신상록', org: '함께하는다문화네트워크 이사장',            position: '교장',       email: 'pc745745@nate.com',         nations: '이주민 자녀',               mission: '이주민 자녀 교육' },
  { group: 'ADVISOR', order: 4,  title: '자문위원', name: '문창선', org: '위디선교회 대표' },
  { group: 'ADVISOR', order: 5,  title: '자문위원', name: '허은열', org: '씨앗선교교회',                         position: '대표',       email: 'all4dcf@hanmail.net',        nations: '다국적',                    mission: '노동자, 유학생, 이주 가정, 무슬림, 난민' },
  { group: 'ADVISOR', order: 6,  title: '자문위원', name: '서기원', org: '부천몽골교회',                         position: '담임목사',    email: 'Worldfamily333@gmail.com',   nations: '몽골',                      mission: '노동자, 유학생, 이주 가정' },
  { group: 'ADVISOR', order: 7,  title: '자문위원', name: '이승주', org: '탄자니아 선교사 / 귀국 후 이주민지원사역', position: '선교사',     email: 'kkamjwi@gmail.com',         nations: '탄자니아, 중동',            mission: '노동자, 유학생' },
  { group: 'ADVISOR', order: 8,  title: '자문위원', name: '박찬식', org: '국제이주자선교포럼 대표',               position: '선교사',     email: 'kcisr@hanmail.net',          nations: '이주민선교 연구(중국)',       mission: '노동자' },
  // 운영위원회 (구 핵심 임원)
  { group: 'EXECUTIVE', order: 1,  title: '상임대표',   name: '남양규', org: '서울내이션즈교회',           position: '목사',    email: 'namnamadfc@hanmail.net',     nations: '이주민',                mission: '노동자, 유학생' },
  { group: 'EXECUTIVE', order: 2,  title: '공동대표',   name: '최고수', org: '공촌교회',                  position: '담임목사', email: 'choigosu60@naver.com',       nations: '몽골',                  mission: '노동자, 유학생, 이주 가정' },
  { group: 'EXECUTIVE', order: 3,  title: '공동대표',   name: '안정호', org: '송우벗사랑베트남교회',        position: '선교목사', email: 'jeongho7001@hanmail.com',    nations: '베트남, 북한, 이스라엘',   mission: '노동자, 유학생, 이주 가정' },
  { group: 'EXECUTIVE', order: 4,  title: '공동대표',   name: '이동철', org: '삼목회' },
  { group: 'EXECUTIVE', order: 5,  title: '공동대표',   name: '오승재', org: '권능태국인교회 (천안)',       position: '목사',    email: 'thank119@naver.com',         nations: '태국',                  mission: '노동자, 유학생, 이주 가정' },
  { group: 'EXECUTIVE', order: 6,  title: '감사',       name: '손승호', org: '울산·경남세계선교협의회 사무총장' },
  { group: 'EXECUTIVE', order: 7,  title: '감사',       name: '안명호', org: '할렐루야시니어 한국팀장' },
  { group: 'EXECUTIVE', order: 8,  title: '훈련원장',   name: '최고수', org: '한영대학교 이주민선교사훈련원', position: '담임목사', email: 'choigosu60@naver.com', nations: '몽골', mission: '노동자, 유학생, 이주 가정' },
  { group: 'EXECUTIVE', order: 9,  title: '사무총장',   name: '홍광표', org: '새생명태국인교회',            position: '목사',    email: 'hkp7252@hanmail.net',        nations: '태국, 라오스',            mission: '노동자, 유학생, 이주 가정, 난민' },
  { group: 'EXECUTIVE', order: 10, title: '사무부총장',  name: '박세호', org: '킨미니스트리',               position: '목사',    email: 'strongsethpark@gmail.com',   nations: '카렌(미얀마)',             mission: '노동자, 유학생, 이주 가정, 난민' },
  { group: 'EXECUTIVE', order: 11, title: '서기',        name: '이병인', org: '엘림이주민센터',              position: '목사',    email: 'kumohdo@hanmail.net',        nations: '중국',                   mission: '이주 가정' },
  { group: 'EXECUTIVE', order: 12, title: '부서기',      name: '정유식', org: '네팔노동자교회',              position: '선교사',  email: 'newhouse2022@naver.com',     nations: '네팔',                   mission: '노동자' },
  { group: 'EXECUTIVE', order: 13, title: '회계',        name: '이창호', org: '러브스리랑카교회',            position: '목사',    email: 'dynamic-logos28@hanmail.net', nations: '스리랑카',               mission: '노동자, 이주 가정' },
  { group: 'EXECUTIVE', order: 14, title: '부회계',      name: '강은혜', org: '에스더기도운동 / Global Intercessory Network' },
  // 언어권 위원장
  { group: 'LANGUAGE_CHAIR', order: 1,  title: '몽골위원장',       name: '이해동', org: '다하나국제교회',          position: '상임대표·목사', email: 'all4mn@naver.com',          nations: '몽골',             mission: '노동자, 유학생, 이주 가정' },
  { group: 'LANGUAGE_CHAIR', order: 2,  title: '유학생위원장',     name: '정재훈', org: '영락교회 유학생담당' },
  { group: 'LANGUAGE_CHAIR', order: 3,  title: '네팔위원장',       name: '유병설', org: '광탄열방교회',             position: '목사',   email: 'amarina@hanmail.net',        nations: '네팔',             mission: '노동자' },
  { group: 'LANGUAGE_CHAIR', order: 4,  title: '이슬람위원장',     name: '안드레', org: '열무김치회장',              position: '선교사', email: 'ahndrewjoshua@gmail.com',    nations: '23개 아랍 국가',    mission: '노동자, 이주 가정, 무슬림, 난민' },
  { group: 'LANGUAGE_CHAIR', order: 5,  title: '태국위원장',       name: '윤윤경', org: '인천태국인교회',            position: '선교사', email: 'laurayoun@hanmail.net',      nations: '태국',             mission: '노동자, 이주 가정' },
  { group: 'LANGUAGE_CHAIR', order: 6,  title: '스리랑카위원장',   name: '이창호', org: '러브스리랑카교회',          position: '목사',   email: 'dynamic-logos28@hanmail.net', nations: '스리랑카',         mission: '노동자, 이주 가정' },
  { group: 'LANGUAGE_CHAIR', order: 7,  title: '인도네시아위원장', name: '렌디',  org: 'AIC수원지부' },
  { group: 'LANGUAGE_CHAIR', order: 8,  title: '필리핀위원장',     name: '최경식', org: '안산' },
  { group: 'LANGUAGE_CHAIR', order: 9,  title: '러시아권위원장',   name: '한예승', org: '인천하늘영광교회' },
  { group: 'LANGUAGE_CHAIR', order: 10, title: '중국위원장',       name: '강철민', org: 'KMAC 상임총무' },
  // 지역 위원장
  { group: 'REGION_CHAIR', order: 1, title: '경기남부 지역위원장', name: '이민기', org: '평택 쉼터교회',                      position: '목사',   email: 'meankey00@gmail.com',      nations: '인도네시아, 베트남', mission: '노동자, 이주 가정' },
  { group: 'REGION_CHAIR', order: 2, title: '경기서부 지역위원장', name: '안드레', org: '베이튼누루센터',                     position: '선교사', email: 'ahndrewjoshua@gmail.com',  nations: '23개 아랍 국가',    mission: '노동자, 이주 가정, 무슬림, 난민' },
  { group: 'REGION_CHAIR', order: 3, title: '경기북부 지역위원장', name: '김광현', org: '동두천예수사랑교회' },
  { group: 'REGION_CHAIR', order: 4, title: '호남 지역위원장',    name: '김창식', org: '하나되는 교회 / 물댄동산다문화센터', position: '목사',   email: 'jj6231118@naver.com',      nations: '인도, 파키스탄',    mission: '노동자' },
  { group: 'REGION_CHAIR', order: 5, title: '충청 지역위원장',    name: '권정현', org: '싼티팝코리아태국인교회 (천안)' },
  { group: 'REGION_CHAIR', order: 6, title: '강원 지역위원장',    name: '노인국', org: '영월서머나교회' },
  { group: 'REGION_CHAIR', order: 7, title: '제주 지역위원장',    name: '한용길', org: '사)제주외국인평화공동체' },
  // 교단 대표
  { group: 'DENOMINATION_REP', order: 1, title: '합동교단 대표',   name: '최규정', org: '인천올프렌즈교회',          position: '목사/선교사', email: 'gyujungchoi@hotmail.com', nations: '캄보디아',    mission: '노동자, 유학생' },
  { group: 'DENOMINATION_REP', order: 2, title: '백석교단 대표',   name: '허은열', org: '씨앗선교회 대표',           position: '대표',       email: 'all4dcf@hanmail.net',     nations: '다국적',      mission: '노동자, 유학생, 이주 가정, 무슬림, 난민' },
  { group: 'DENOMINATION_REP', order: 3, title: '통합교단 대표',   name: '도주명', org: '전주 온교회' },
  { group: 'DENOMINATION_REP', order: 4, title: '순복음교단 대표', name: '이익성', org: '이주민월드비전교회',         position: '목사/선교사', email: 'johnleeik@naver.com',     nations: '페루, 인도',  mission: '노동자, 이주 가정, 무슬림, 난민' },
  { group: 'DENOMINATION_REP', order: 5, title: '침례교단 대표',   name: '장인식', org: '침례교해외선교회 (지구촌교회파송)', position: '목사/선교사', email: 'yindeej@daum.net', nations: '태국',        mission: '노동자, 유학생, 이주 가정' },
  { group: 'DENOMINATION_REP', order: 6, title: '대신교단 대표',   name: '박만규', org: '세종시',                    position: '목사/선교사', email: 'maranatha300@naver.com',  nations: '동남아',      mission: '노동자, 이주 가정' },
  { group: 'DENOMINATION_REP', order: 7, title: '고신교단 대표',   name: '강하전', org: '부산 중국인 유학생 선교사' },
  { group: 'DENOMINATION_REP', order: 8, title: '합신교단 대표',   name: '박용수', org: '용인대 중국인 유학생 선교사' },
  { group: 'DENOMINATION_REP', order: 9, title: '기장교단 대표',   name: '이정혁', org: '',                          position: '목사',       email: '5663004@hanmail.net',      nations: '중국',        mission: '노동자, 동포' },
  // 네트워크 위원장
  { group: 'NETWORK_CHAIR', order: 1, title: '현지인사역자네트워크위원장', name: '하니프', org: '한국미술인선교회 선교사' },
  { group: 'NETWORK_CHAIR', order: 2, title: '지역교회네트워크위원장',    name: '김귀희', org: '사랑의 교회, 디아스포라 고문' },
]

async function main() {
  console.log('Seeding categories...')
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, type: cat.type, order: cat.order },
      create: cat,
    })
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`)

  console.log('Seeding leaders...')
  const existing = await prisma.leader.count()
  if (existing === 0) {
    for (const l of LEADERS) {
      await prisma.leader.create({
        data: {
          group:    l.group,
          title:    l.title,
          name:     l.name,
          org:      l.org      ?? null,
          position: l.position ?? null,
          phone:    l.phone    ?? null,
          email:    l.email    ?? null,
          nations:  l.nations  ?? null,
          mission:  l.mission  ?? null,
          order:    l.order,
          isActive: true,
        },
      })
    }
    console.log(`Seeded ${LEADERS.length} leaders.`)
  } else {
    console.log(`Leaders already seeded (${existing} records). Skipping.`)
  }

  // ── 뉴스 시스템 초기 데이터 ─────────────────────────────────────────────
  await seedNews()
}

async function seedNews() {
  const NEWS_CATEGORIES = [
    { key: 'LAW', label: '법령·정책', colorClass: 'bg-blue-100 text-blue-700', keywords: ['법령', '법률', '정책', '제도', '출입국', '체류', '비자', '법무부', '시행령'], order: 10 },
    { key: 'STATISTICS', label: '통계·연구', colorClass: 'bg-violet-100 text-violet-700', keywords: ['통계', '연구', '조사', '보고서', '인구', '지표', '실태조사'], order: 20 },
    { key: 'MULTICULTURAL', label: '다문화가족', colorClass: 'bg-pink-100 text-pink-700', keywords: ['다문화가족', '다문화 가정', '다문화가정', '다문화 자녀', '다문화자녀', '결혼이민자', '가족센터', '방문교육', '자조모임'], order: 30 },
    { key: 'MIGRANT_WORKER', label: '이주노동자', colorClass: 'bg-amber-100 text-amber-700', keywords: ['이주노동자', '외국인근로자', '외국인 근로자', '고용허가제', '고용허가', '노동자', '근로자', 'E-9', 'H-2'], order: 40 },
    { key: 'STUDENT', label: '유학생', colorClass: 'bg-emerald-100 text-emerald-700', keywords: ['유학생', '외국인학생', '외국인 학생', '다문화학생', '국제학생', '한국어교육'], order: 50 },
    { key: 'OTHER', label: '기타', colorClass: 'bg-gray-100 text-gray-600', keywords: [], order: 999 },
  ]

  for (const category of NEWS_CATEGORIES) {
    await prisma.newsCategoryConfig.upsert({
      where: { key: category.key },
      update: { ...category, isEnabled: true, isSystem: true },
      create: { ...category, isEnabled: true, isSystem: true },
    })
  }

  // ── NewsSettings (싱글턴, id=1) ──────────────────────────────────────────
  await prisma.newsSettings.upsert({
    where:  { id: 1 },
    update: {},   // 이미 존재하면 덮어쓰지 않음
    create: {
      id:                 1,
      isEnabled:          true,
      cronTime:           '0 23 * * *',   // UTC 23:00 = KST 08:00
      collectHour:        8,
      collectMinute:      0,
      aiProvider:         'gemini',
      relevanceThreshold: 0.5,            // 50점 이상
      maxArticlesPerRun:  50,
    },
  })
  console.log('NewsSettings seeded.')

  // ── NewsSource 기본 소스들 ────────────────────────────────────────────────
  const COMMON_KEYWORDS = ['이주민', '다문화', '외국인', '이주노동자', '유학생']

  const SOURCES = [
    // ── RSS 소스 ──────────────────────────────────────────────────────────
    {
      name:            '법제처 최신법령 RSS',
      url:             'https://www.law.go.kr',
      rssUrl:          'https://www.law.go.kr/LSW/rss/rssLsInfoP.do',
      apiType:         'rss',
      keywords:        [...COMMON_KEYWORDS, '출입국', '체류', '다문화가족', '외국인근로자'],
      defaultCategory: 'LAW' as const,
      order:           1,
    },
    {
      name:            '통계청 보도자료 RSS',
      url:             'https://kostat.go.kr',
      rssUrl:          'https://kostat.go.kr/board/rss.do?boardId=0000000001',
      apiType:         'rss',
      keywords:        [...COMMON_KEYWORDS, '인구', '이민', '체류외국인'],
      defaultCategory: 'STATISTICS' as const,
      order:           2,
    },
    {
      name:            '여성가족부 보도자료 RSS',
      url:             'https://www.mogef.go.kr',
      rssUrl:          'https://www.mogef.go.kr/nw/rpd/nw_rpd_s001d.do?rss=Y',
      apiType:         'rss',
      keywords:        ['다문화가족', '결혼이민자', '다문화', '외국인'],
      defaultCategory: 'MULTICULTURAL' as const,
      order:           3,
    },
    {
      name:            '고용노동부 보도자료 RSS',
      url:             'https://www.moel.go.kr',
      rssUrl:          'https://www.moel.go.kr/news/enews/rss/rss.do',
      apiType:         'rss',
      keywords:        ['외국인근로자', '이주노동자', 'E-9', 'H-2', '고용허가'],
      defaultCategory: 'MIGRANT_WORKER' as const,
      order:           4,
    },
    {
      name:            '교육부 보도자료 RSS',
      url:             'https://www.moe.go.kr',
      rssUrl:          'https://www.moe.go.kr/bbs/board.do?bbsId=BBSMSTR_000000000050&searchCondition=rss',
      apiType:         'rss',
      keywords:        ['유학생', '외국인학생', '다문화학생', '국제학생'],
      defaultCategory: 'STUDENT' as const,
      order:           5,
    },
    // ── 네이버 뉴스 API 소스 ──────────────────────────────────────────────
    {
      name:            '네이버 뉴스 — 이주민',
      url:             'https://news.naver.com',
      rssUrl:          null,
      apiType:         'naver',
      keywords:        ['이주민 다문화', '이주민 외국인', '이주민 지원', '외국인주민', '이민자 사회통합'],
      defaultCategory: 'OTHER' as const,
      order:           10,
    },
    {
      name:            '네이버 뉴스 — 다문화가족',
      url:             'https://news.naver.com',
      rssUrl:          null,
      apiType:         'naver',
      keywords:        ['다문화가족', '결혼이민자', '다문화 자녀'],
      defaultCategory: 'MULTICULTURAL' as const,
      order:           11,
    },
    {
      name:            '네이버 뉴스 — 이주노동자',
      url:             'https://news.naver.com',
      rssUrl:          null,
      apiType:         'naver',
      keywords:        ['이주노동자', '외국인근로자', '고용허가제'],
      defaultCategory: 'MIGRANT_WORKER' as const,
      order:           12,
    },
  ]

  let created = 0
  for (const src of SOURCES) {
    await prisma.newsSource.upsert({
      where:  { name: src.name },
      update: {},   // 이미 존재하면 덮어쓰지 않음
      create: {
        name:            src.name,
        url:             src.url,
        rssUrl:          src.rssUrl,
        apiType:         src.apiType,
        isEnabled:       true,
        keywords:        src.keywords,
        defaultCategory: src.defaultCategory,
        order:           src.order,
      },
    })
    created++
  }
  console.log(`NewsSource seeded: ${created}개`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
