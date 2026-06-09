import { GoogleGenerativeAI } from '@google/generative-ai'

const TRANSCRIPTION_PROMPT = `Transcribe this audio recording accurately.
Return only the spoken transcript text with natural punctuation.
Preserve the original language (Korean and/or English). Do not add commentary, labels, or markdown.`

const DEFAULT_MODEL_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
]

const MAX_RETRIES_PER_MODEL = 2
const RETRY_BASE_DELAY_MS = 800

function getModelFallbacks(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim()
  const models = configured
    ? [configured, ...DEFAULT_MODEL_FALLBACKS]
    : DEFAULT_MODEL_FALLBACKS
  return [...new Set(models)]
}

function isRetryableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /503|429|high demand|unavailable|overloaded|resource exhausted/i.test(message)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchAudioBuffer(filePath: string): Promise<Buffer> {
  const res = await fetch(filePath)
  if (!res.ok) throw new Error(`Failed to download recording: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function generateTranscript(
  genAI: GoogleGenerativeAI,
  modelName: string,
  audioBase64: string,
  mimeType: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelName })
  const result = await model.generateContent([
    {
      inlineData: {
        data: audioBase64,
        mimeType,
      },
    },
    { text: TRANSCRIPTION_PROMPT },
  ])
  return result.response.text().trim()
}

/**
 * Transcribe audio/video bytes via Gemini audio understanding.
 */
export async function transcribeBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

  const audioBase64 = buffer.toString('base64')
  const genAI = new GoogleGenerativeAI(apiKey)
  const models = getModelFallbacks()
  const errors: string[] = []

  for (const modelName of models) {
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const text = await generateTranscript(genAI, modelName, audioBase64, mimeType)
        if (!text) throw new Error('Gemini returned empty transcript')
        return text
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`${modelName} (attempt ${attempt + 1}): ${message}`)

        if (isRetryableError(err) && attempt < MAX_RETRIES_PER_MODEL) {
          await sleep(RETRY_BASE_DELAY_MS * (attempt + 1))
          continue
        }
        break
      }
    }
  }

  const lastError = errors.at(-1) ?? 'Unknown error'
  if (isRetryableError(lastError)) {
    throw new Error(
      'Gemini transcription API is temporarily overloaded. Please wait a moment and try again.'
    )
  }
  throw new Error(`Gemini transcription error: ${lastError}`)
}

/**
 * Transcribe a recording stored at a public R2 URL via Gemini audio understanding.
 */
export async function transcribeRecording(filePath: string, mimeType: string): Promise<string> {
  const buffer = await fetchAudioBuffer(filePath)
  return transcribeBuffer(buffer, mimeType)
}
