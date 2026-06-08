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

export async function extractBusinessCardData(
  imageBase64: string,
  mediaType: string
): Promise<BusinessCardOcrResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            { type: 'text', text: OCR_PROMPT },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude Vision API error: ${response.status} ${err}`)
  }

  const data = await response.json() as {
    content: Array<{ type: string; text?: string }>
  }

  const text = data.content.find((c) => c.type === 'text')?.text ?? '{}'
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
}
