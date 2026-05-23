export interface DriveEnvOptions {
  folderId: string
  clientEmail: string
  privateKey: string
}

function base64url(buf: ArrayBuffer | Buffer): string {
  const b64 = Buffer.isBuffer(buf)
    ? buf.toString('base64')
    : Buffer.from(buf).toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const header  = base64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const payload = base64url(Buffer.from(JSON.stringify({
    iss:   clientEmail,
    scope: 'https://www.googleapis.com/auth/drive',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  })))

  const signingInput = `${header}.${payload}`

  // \n 이스케이프 정규화 (dotenv 환경마다 다름)
  const normalizedKey = privateKey.replace(/\\n/g, '\n')

  const pemBody = normalizedKey
    .replace(/-----BEGIN PRIVATE KEY-----\n?/, '')
    .replace(/\n?-----END PRIVATE KEY-----\n?/, '')
    .replace(/\s/g, '')

  const keyBuf = Buffer.from(pemBody, 'base64')

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuf,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    Buffer.from(signingInput),
  )

  const jwt = `${signingInput}.${base64url(signature)}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  })

  if (!tokenRes.ok) {
    const msg = await tokenRes.text()
    throw new Error(`Google 액세스 토큰 발급 실패: ${msg}`)
  }

  const { access_token } = await tokenRes.json() as { access_token: string }
  return access_token
}

export async function uploadFileToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  options: DriveEnvOptions,
): Promise<string> {
  const { folderId, clientEmail, privateKey } = options

  const accessToken = await getAccessToken(clientEmail, privateKey)

  const boundary = 'kima_' + Math.random().toString(36).slice(2)
  const metadata  = JSON.stringify({ name: fileName, parents: [folderId] })

  const part1 = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n` +
    `\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n` +
    `\r\n`,
  )
  const part2    = Buffer.from(`\r\n--${boundary}--`)
  const fullBody = Buffer.concat([part1, buffer, part2])

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id&supportsAllDrives=true',
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: fullBody,
    },
  )

  if (!uploadRes.ok) {
    const msg = await uploadRes.text()
    throw new Error(`Drive 업로드 실패: ${msg}`)
  }

  const { id: fileId } = await uploadRes.json() as { id: string }
  if (!fileId) throw new Error('Drive 파일 ID를 가져올 수 없습니다.')

  // 누구나 링크로 볼 수 있도록 공유 설정
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })

  return `https://drive.google.com/file/d/${fileId}/view`
}
