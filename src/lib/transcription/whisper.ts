interface SpeechEncodingConfig {
  encoding: string
  sampleRateHertz?: number
}

const MIME_ENCODING: Record<string, SpeechEncodingConfig> = {
  'audio/mpeg': { encoding: 'MP3' },
  'audio/mp4': { encoding: 'MP3' },
  'audio/wav': { encoding: 'LINEAR16', sampleRateHertz: 16000 },
  'audio/webm': { encoding: 'WEBM_OPUS' },
  'audio/ogg': { encoding: 'OGG_OPUS' },
  'video/mp4': { encoding: 'MP3' },
  'video/webm': { encoding: 'WEBM_OPUS' },
  'video/quicktime': { encoding: 'MP3' },
}

const SYNC_MAX_BYTES = 9 * 1024 * 1024 // ~1 min audio at high bitrate

function getApiKey(): string {
  const key = process.env.GOOGLE_SPEECH_API_KEY?.trim()
  if (!key) throw new Error('GOOGLE_SPEECH_API_KEY is not configured')
  return key
}

function getEncodingConfig(mimeType: string): SpeechEncodingConfig {
  return MIME_ENCODING[mimeType] ?? { encoding: 'ENCODING_UNSPECIFIED' }
}

async function fetchAudioBuffer(filePath: string): Promise<Buffer> {
  const res = await fetch(filePath)
  if (!res.ok) throw new Error(`Failed to download recording: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

function extractTranscript(payload: {
  results?: Array<{ alternatives?: Array<{ transcript?: string }> }>
}): string {
  const parts =
    payload.results
      ?.map((r) => r.alternatives?.[0]?.transcript?.trim())
      .filter((t): t is string => !!t) ?? []
  return parts.join('\n').trim()
}

async function recognizeSync(
  audioBase64: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const encodingConfig = getEncodingConfig(mimeType)
  const res = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          ...encodingConfig,
          languageCode: 'ko-KR',
          enableAutomaticPunctuation: true,
          alternativeLanguageCodes: ['en-US'],
        },
        audio: { content: audioBase64 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Speech-to-Text recognize failed: ${res.status} ${err}`)
  }

  const data = await res.json()
  const text = extractTranscript(data)
  if (!text) throw new Error('Speech-to-Text returned empty transcript')
  return text
}

async function recognizeLongRunning(
  audioBase64: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const encodingConfig = getEncodingConfig(mimeType)
  const startRes = await fetch(
    `https://speech.googleapis.com/v1/speech:longrunningrecognize?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          ...encodingConfig,
          languageCode: 'ko-KR',
          enableAutomaticPunctuation: true,
          alternativeLanguageCodes: ['en-US'],
        },
        audio: { content: audioBase64 },
      }),
    }
  )

  if (!startRes.ok) {
    const err = await startRes.text()
    throw new Error(`Speech-to-Text longrunningrecognize failed: ${startRes.status} ${err}`)
  }

  const started = await startRes.json() as { name?: string }
  if (!started.name) throw new Error('Speech-to-Text long operation missing name')

  const deadline = Date.now() + 5 * 60 * 1000
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000))
    const opRes = await fetch(
      `https://speech.googleapis.com/v1/${started.name}?key=${encodeURIComponent(apiKey)}`
    )
    if (!opRes.ok) {
      const err = await opRes.text()
      throw new Error(`Speech-to-Text operation poll failed: ${opRes.status} ${err}`)
    }
    const op = await opRes.json() as {
      done?: boolean
      error?: { message?: string }
      response?: { results?: Array<{ alternatives?: Array<{ transcript?: string }> }> }
    }
    if (op.error?.message) throw new Error(op.error.message)
    if (op.done) {
      const text = extractTranscript(op.response ?? {})
      if (!text) throw new Error('Speech-to-Text returned empty transcript')
      return text
    }
  }

  throw new Error('Speech-to-Text long operation timed out')
}

/**
 * Transcribe a recording stored at a public R2 URL via Google Speech-to-Text REST API.
 */
export async function transcribeRecording(filePath: string, mimeType: string): Promise<string> {
  const apiKey = getApiKey()
  const buffer = await fetchAudioBuffer(filePath)
  const audioBase64 = buffer.toString('base64')

  if (buffer.length <= SYNC_MAX_BYTES) {
    return recognizeSync(audioBase64, mimeType, apiKey)
  }
  return recognizeLongRunning(audioBase64, mimeType, apiKey)
}
