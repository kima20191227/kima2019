import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase'
import { addressToKimaRegion } from '@/lib/normalizeKoreanAddress'
import orgsData from '@/data/gmfsns_orgs.json'

interface RawOrg {
  id: number
  name: string
  type?: string
  languages?: string[]
  targets?: string[]
  address?: string
  phone?: string
  email?: string
  website?: string
  description?: string
  image?: string | null
  date?: string | null
  lat?: number | null
  lng?: number | null
  introLines?: string[]
  contactItems?: string[]
}

export async function POST(_req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  // Fetch all Supabase edits
  let editMap = new Map<number, Record<string, any>>()
  try {
    const supabase = createAdminClient()
    const { data: edits } = await supabase
      .from('gmfsns_org_edits')
      .select('org_id, type, targets, languages, address, phone, email, website, image_url, intro_lines, contact_items')
    if (edits) {
      editMap = new Map(edits.map((e: any) => [e.org_id, e]))
    }
  } catch {
    // Supabase table may not exist — proceed with JSON only
  }

  const orgs = orgsData as unknown as RawOrg[]
  let imported = 0
  let failed = 0
  const errors: string[] = []

  for (const org of orgs) {
    try {
      const edit = editMap.get(org.id)

      const type = edit?.type ?? org.type ?? null
      const targets: string[] = edit?.targets?.length ? edit.targets : (org.targets ?? [])
      const languages: string[] = edit?.languages?.length ? edit.languages : (org.languages ?? [])
      const address = edit?.address ?? org.address ?? null
      const phone = edit?.phone ?? org.phone ?? null
      const email = edit?.email ?? org.email ?? null
      const website = edit?.website ?? org.website ?? null
      const image = edit?.image_url ?? (org.image?.startsWith('/') ? null : org.image) ?? null
      const introLines: string[] = edit?.intro_lines?.length ? edit.intro_lines : (org.introLines ?? [])
      const contactItems: string[] = edit?.contact_items?.length ? edit.contact_items : (org.contactItems ?? [])

      const region = addressToKimaRegion(address, '기타')

      await prisma.organization.upsert({
        where: { gmfsnsId: org.id },
        create: {
          gmfsnsId: org.id,
          name: org.name,
          description: org.description ?? null,
          region,
          type,
          languages,
          targets,
          address,
          phone,
          email,
          website,
          image,
          introLines,
          contactItems,
          lat: org.lat ?? null,
          lng: org.lng ?? null,
          source: 'gmfsns',
          isPublic: true,
        },
        update: {
          name: org.name,
          description: org.description ?? null,
          region,
          type,
          languages,
          targets,
          address,
          phone,
          email,
          website,
          image,
          introLines,
          contactItems,
          lat: org.lat ?? null,
          lng: org.lng ?? null,
          source: 'gmfsns',
          isPublic: true,
        },
      })
      imported++
    } catch (err) {
      failed++
      errors.push(`org ${org.id} (${org.name}): ${String(err)}`)
    }
  }

  return NextResponse.json({
    message: `Import complete: ${imported} imported, ${failed} failed`,
    imported,
    failed,
    errors: errors.slice(0, 20),
  })
}
