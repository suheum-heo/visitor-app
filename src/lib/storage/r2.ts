import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!

export function extractR2Key(filePath: string): string | null {
  if (!PUBLIC_URL || !filePath.startsWith(PUBLIC_URL)) return null
  return filePath.slice(PUBLIC_URL.length + 1)
}

export async function uploadFile(key: string, body: Buffer | Uint8Array, contentType: string) {
  await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }))
  return `${PUBLIC_URL}/${key}`
}

export async function deleteFile(key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600) {
  return getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn }
  )
}

export async function checkR2Connectivity(): Promise<{ ok: boolean; error?: string }> {
  try {
    await r2.send(new HeadBucketCommand({ Bucket: BUCKET }))
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'R2 connectivity check failed'
    return { ok: false, error: message }
  }
}
