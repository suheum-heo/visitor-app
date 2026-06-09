import { decryptFile, isEncrypted } from '@/lib/storage/encrypt'

export async function fetchFileFromUrl(filePath: string): Promise<Buffer> {
  const res = await fetch(filePath)
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

export async function resolveFileContents(
  filePath: string,
  iv: string | null | undefined,
  authTag: string | null | undefined
): Promise<Buffer> {
  const data = await fetchFileFromUrl(filePath)
  if (!isEncrypted(iv, authTag)) return data
  return decryptFile(data, iv!, authTag!)
}
