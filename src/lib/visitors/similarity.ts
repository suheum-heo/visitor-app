export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
}

/** Bigram-based Dice coefficient (0–1). */
export function stringSimilarity(a: string, b: string): number {
  const left = normalizeText(a)
  const right = normalizeText(b)
  if (!left || !right) return 0
  if (left === right) return 1

  const bigrams = (s: string) => {
    const set = new Set<string>()
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2))
    return set
  }

  const aBigrams = bigrams(left)
  const bBigrams = bigrams(right)
  let intersection = 0
  for (const bg of aBigrams) {
    if (bBigrams.has(bg)) intersection++
  }
  return (2 * intersection) / (aBigrams.size + bBigrams.size)
}

export interface DuplicateMatchInput {
  name: string
  company: string | null
}

export interface ScoredVisitorMatch {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  status: string
  scheduled_at: string | null
  similarity: number
}

const DUPLICATE_THRESHOLD = 0.55

export function scoreVisitorDuplicate(
  input: DuplicateMatchInput,
  candidate: DuplicateMatchInput & { id: string; email?: string | null; phone?: string | null; status?: string; scheduled_at?: string | null }
): number {
  const nameScore = stringSimilarity(input.name, candidate.name)
  const inputCompany = input.company?.trim() ?? ''
  const candidateCompany = candidate.company?.trim() ?? ''

  if (!inputCompany && !candidateCompany) {
    return nameScore
  }
  if (!inputCompany || !candidateCompany) {
    return nameScore * 0.85
  }

  const companyScore = stringSimilarity(inputCompany, candidateCompany)
  return nameScore * 0.6 + companyScore * 0.4
}

export function isLikelyDuplicate(score: number): boolean {
  return score >= DUPLICATE_THRESHOLD
}

export { DUPLICATE_THRESHOLD }
