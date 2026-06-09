import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상 입력해주세요'),
})

export const POSITIONS = [
  '목사', '부목사', '선교사', '전도사', '장로', '권사', '집사', '간사', '사역자', '기타',
] as const

export const MINISTRY_LANGUAGES = [
  '베트남어', '네팔어', '몽골어', '인도네시아어', '필리핀어(타갈로그)',
  '러시아어', '중국어', '태국어', '영어',
  '캄보디아어', '미얀마어', '라오스어', '스리랑카어', '아랍어', '힌디어',
  '우즈베크어', '벵골어', '카자흐어', '키르기즈어', '우르두어', '일본어',
  '기타',
] as const

export const MINISTRY_TARGETS = [
  '이주노동자', '유학생', '다문화가정', '난민', '귀국이주민', '기타',
] as const

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, '이름은 2자 이상 입력해주세요')
      .max(50, '이름은 50자 이하로 입력해주세요'),
    email: z.string().email('올바른 이메일 형식을 입력해주세요'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상 입력해주세요')
      .regex(/[a-zA-Z]/, '비밀번호에 영문자를 포함해주세요')
      .regex(/[0-9]/, '비밀번호에 숫자를 포함해주세요'),
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요'),
    position: z.string().min(1, '직분을 선택해주세요'),
    phone: z
      .string()
      .min(1, '전화번호를 입력해주세요')
      .max(20, '전화번호는 20자 이하로 입력해주세요'),
    address: z.string().min(1, '주소를 입력해주세요').max(200, '주소는 200자 이하로 입력해주세요'),
    denomination: z.string().min(1, '소속 교단을 입력해주세요').max(100, '교단명은 100자 이하로 입력해주세요'),
    organization: z.string().max(100, '단체명은 100자 이하로 입력해주세요').optional(),
    ministryLanguages: z
      .array(z.string())
      .min(1, '사역 언어를 1개 이상 입력해주세요'),
    ministryTargets: z
      .array(z.string())
      .min(1, '사역 대상을 1개 이상 입력해주세요'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
