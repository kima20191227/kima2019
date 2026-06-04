import { z } from 'zod'

export const ORG_REGIONS = [
  '서울',
  '경기',
  '인천',
  '부산경남',
  '대구경북',
  '광주전라',
  '대전충청',
  '강원',
  '제주',
  '기타',
] as const

export const LANGUAGES = [
  '네팔어', '베트남어', '태국어', '라오스어', '몽골어', '러시아어',
  '중국&동포', '필리핀어', '캄보디아어', '미얀마어', '영어', '일본어',
  '스리랑카어', '아랍어', '힌디어',
  '인도네시아어', '우즈베크어', '벵골어', '카자흐어', '키르기즈어', '우르두어',
  '기타',
] as const

export const TARGETS = [
  '이주노동자', '유학생', '결혼이민자', '다문화자녀',
  '난민미등록', '귀국이주민', '중보사역', '기타',
] as const

export const ORG_TYPES = [
  '교회', 'NGO', '법률', '의료', '교육',
  '센터', '선교단체', '부설기관', '기타',
] as const

export const organizationSchema = z.object({
  name: z.string().min(1, '단체명을 입력해주세요').max(100, '단체명은 100자 이하로 입력해주세요'),
  representative: z.string().max(50, '대표자명은 50자 이하로 입력해주세요').optional().or(z.literal('')),
  nameEn: z
    .string()
    .regex(/^[a-zA-Z0-9\s\-\.]*$/, '영문, 숫자, 공백, 하이픈만 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  description: z.string().max(500, '소개는 500자 이하로 입력해주세요').optional(),
  region: z.enum(ORG_REGIONS, { message: '지역을 선택해주세요' }),
  languages: z.array(z.string()).min(1, '언어권을 1개 이상 선택해주세요'),
  targets: z.array(z.string()).min(1, '사역대상을 1개 이상 선택해주세요'),
  type: z.enum(ORG_TYPES).optional(),
  address: z.string().optional(),
  phone: z
    .string()
    .regex(/^[\d\-\+\(\)\s]*$/, '올바른 전화번호 형식을 입력해주세요')
    .optional()
    .or(z.literal('')),
  email: z.string().email('올바른 이메일 형식을 입력해주세요').optional().or(z.literal('')),
  website: z.string().url('올바른 URL 형식을 입력해주세요').optional().or(z.literal('')),
})

export type OrganizationInput = z.infer<typeof organizationSchema>
