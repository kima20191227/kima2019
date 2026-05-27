import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OrganizationCard } from '@/components/directory/OrganizationCard'
import type { Organization } from '@prisma/client'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    className,
  }: {
    href: string
    children: React.ReactNode
    onClick?: React.MouseEventHandler
    className?: string
  }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}))

const mockOrg: Organization = {
  id: 'test-org-id',
  gmfsnsId: null,
  name: '테스트 선교단체',
  representative: null,
  nameEn: 'Test Mission',
  description: '테스트용 단체 소개입니다.',
  region: '서울경기인천',
  languages: ['베트남어', '네팔어'],
  targets: ['이주노동자'],
  type: 'NGO',
  address: '서울시 종로구 종로 1가',
  lat: 37.57,
  lng: 126.98,
  phone: '02-1234-5678',
  email: 'test@example.org',
  website: 'https://example.org',
  image: null,
  introLines: [],
  contactItems: [],
  source: null,
  isPublic: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('OrganizationCard', () => {
  it('단체명과 지역을 렌더링한다', () => {
    render(<OrganizationCard org={mockOrg} />)
    expect(screen.getByText('테스트 선교단체')).toBeInTheDocument()
    expect(screen.getByText('서울경기인천')).toBeInTheDocument()
  })

  it('영문명을 렌더링한다', () => {
    render(<OrganizationCard org={mockOrg} />)
    expect(screen.getByText('Test Mission')).toBeInTheDocument()
  })

  it('사역유형 태그를 렌더링한다', () => {
    render(<OrganizationCard org={mockOrg} />)
    expect(screen.getByText('NGO')).toBeInTheDocument()
  })

  it('언어권 태그를 렌더링한다', () => {
    render(<OrganizationCard org={mockOrg} />)
    expect(screen.getByText('베트남어')).toBeInTheDocument()
    expect(screen.getByText('네팔어')).toBeInTheDocument()
  })

  it('showContact 없이 렌더링하면 연락처를 숨긴다', () => {
    render(<OrganizationCard org={mockOrg} />)
    expect(screen.queryByText('02-1234-5678')).not.toBeInTheDocument()
    expect(screen.queryByText('test@example.org')).not.toBeInTheDocument()
  })

  it('showContact=false이면 연락처를 숨긴다', () => {
    render(<OrganizationCard org={mockOrg} showContact={false} />)
    expect(screen.queryByText('02-1234-5678')).not.toBeInTheDocument()
    expect(screen.queryByText('test@example.org')).not.toBeInTheDocument()
  })

  it('showContact=true이면 전화번호와 이메일을 표시한다', () => {
    render(<OrganizationCard org={mockOrg} showContact={true} />)
    expect(screen.getByText('02-1234-5678')).toBeInTheDocument()
    expect(screen.getByText('test@example.org')).toBeInTheDocument()
  })

  it('isSelected=true이면 강조 스타일이 적용된다', () => {
    const { container } = render(<OrganizationCard org={mockOrg} isSelected={true} />)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('ring-1')
  })

  it('isSelected=false이면 기본 스타일이 적용된다', () => {
    const { container } = render(<OrganizationCard org={mockOrg} isSelected={false} />)
    const card = container.firstChild as HTMLElement
    expect(card.className).not.toContain('ring-1')
  })

  it('상세 보기 링크가 올바른 href를 가진다', () => {
    render(<OrganizationCard org={mockOrg} />)
    const link = screen.getByText('상세 보기 →').closest('a')
    expect(link).toHaveAttribute('href', '/directory/test-org-id')
  })

  it('언어권이 4개 이상이면 +N 태그를 표시한다', () => {
    const orgWithManyLangs: Organization = {
      ...mockOrg,
      languages: ['베트남', '네팔', '몽골', '중국'],
    }
    render(<OrganizationCard org={orgWithManyLangs} />)
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('onSelect 핸들러가 카드 클릭 시 호출된다', () => {
    const onSelect = vi.fn()
    const { container } = render(<OrganizationCard org={mockOrg} onSelect={onSelect} />)
    fireEvent.click(container.firstChild as HTMLElement)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('소개 텍스트를 렌더링한다', () => {
    render(<OrganizationCard org={mockOrg} />)
    expect(screen.getByText('테스트용 단체 소개입니다.')).toBeInTheDocument()
  })

  it('주소를 렌더링한다', () => {
    render(<OrganizationCard org={mockOrg} />)
    expect(screen.getByText('서울시 종로구 종로 1가')).toBeInTheDocument()
  })

  it('phone이 없으면 연락처 섹션이 나타나지 않는다', () => {
    const orgNoPhone: Organization = { ...mockOrg, phone: null }
    render(<OrganizationCard org={orgNoPhone} showContact={true} />)
    expect(screen.queryByText('02-1234-5678')).not.toBeInTheDocument()
  })
})
