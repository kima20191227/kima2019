import { google } from 'googleapis'
import { Readable } from 'stream'

function getDriveClient(keyJson: string) {
  const credentials = JSON.parse(keyJson)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return google.drive({ version: 'v3', auth })
}

export interface DriveEnvOptions {
  folderId: string
  serviceAccountKey: string
}

export async function uploadFileToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  options: DriveEnvOptions,
): Promise<string> {
  const { folderId, serviceAccountKey } = options

  const drive = getDriveClient(serviceAccountKey)

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
