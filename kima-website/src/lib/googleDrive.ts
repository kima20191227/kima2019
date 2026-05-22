import { google } from 'googleapis'
import { Readable } from 'stream'

function getDriveClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY 환경변수가 설정되지 않았습니다.')

  const credentials = JSON.parse(keyJson)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return google.drive({ version: 'v3', auth })
}

export async function uploadFileToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const folderId = process.env.GOOGLE_DRIVE_RESOURCE_FOLDER_ID
  if (!folderId) throw new Error('GOOGLE_DRIVE_RESOURCE_FOLDER_ID 환경변수가 설정되지 않았습니다.')

  const drive = getDriveClient()

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
