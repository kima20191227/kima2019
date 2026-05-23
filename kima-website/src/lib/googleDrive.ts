import { google } from 'googleapis'
import { Readable } from 'stream'

function getDriveClient(clientEmail: string, privateKey: string) {
  // Normalise \n sequences to actual newlines (dotenv or Cloudflare may keep them escaped)
  const normalizedKey = privateKey.replace(/\\n/g, '\n')
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      client_email: clientEmail,
      private_key: normalizedKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return google.drive({ version: 'v3', auth })
}

export interface DriveEnvOptions {
  folderId: string
  clientEmail: string
  privateKey: string
}

export async function uploadFileToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  options: DriveEnvOptions,
): Promise<string> {
  const { folderId, clientEmail, privateKey } = options

  const drive = getDriveClient(clientEmail, privateKey)

  const stream = Readable.from(buffer)

  const { data } = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id',
  })

  const fileId = data.id
  if (!fileId) throw new Error('Drive 파일 ID를 가져올 수 없습니다.')

  // 누구나 링크로 볼 수 있도록 공유 설정
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  })

  return `https://drive.google.com/file/d/${fileId}/view`
}
