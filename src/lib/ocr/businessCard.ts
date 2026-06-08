import { GoogleGenerativeAI } from '@google/generative-ai'

export interface BusinessCardOcrResult {
  name: string | null
  company: string | null
  position: string | null
  phone: string | null
  email: string | null
  raw: Record<string, unknown>
}

const OCR_PROMPT = `You are a business card OCR assistant. Extract contact information from this business card image.
Return ONLY valid JSON with these fields (use null if not found):
{
  "name": "person's full name",
  "company": "company or organization name",
  "position": "job title or position",
  "phone": "phone number",
  "email": "email address"
}
Do not include any text outside the JSON object.`

const DEFAULT_MODEL_FALLBACKS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3-flash',
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

async function generateOcrText(
  genAI: GoogleGenerativeAI,
  modelName: string,
  imageBase64: string,
  mediaType: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelName })
  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType: mediaType,
      },
    },
    { text: OCR_PROMPT },
  ])
  return result.response.text()
}

export async function extractBusinessCardData(
  imageBase64: string,
  mediaType: string
): Promise<BusinessCardOcrResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

  const genAI = new GoogleGenerativeAI(apiKey)
  const models = getModelFallbacks()
  const errors: string[] = []

  for (const modelName of models) {
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const text = await generateOcrText(genAI, modelName, imageBase64, mediaType)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const parsed = JSON.parse(jsonMatch?.[0] ?? '{}') as Record<string, string | null>

        return {
          name: parsed.name ?? null,
          company: parsed.company ?? null,
          position: parsed.position ?? null,
          phone: parsed.phone ?? null,
          email: parsed.email ?? null,
          raw: parsed,
        }
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
      'Gemini Vision API is temporarily overloaded. Please wait a moment and try again.'
    )
  }
  throw new Error(`Gemini Vision API error: ${lastError}`)
}
