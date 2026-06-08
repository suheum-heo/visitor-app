export function normalizeTag(raw: string): string | null {
  const tag = raw.trim().toLowerCase()
  if (!tag || tag.length > 32) return null
  return tag
}

export function parseTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.map((t) => normalizeTag(String(t))).filter((t): t is string => !!t))]
}

export function parseTagsParam(param: string | null): string[] {
  if (!param?.trim()) return []
  return [
    ...new Set(
      param
        .split(',')
        .map((t) => normalizeTag(t))
        .filter((t): t is string => !!t)
    ),
  ]
}
