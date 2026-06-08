import type { User, Visitor } from '@/types'

export type SelectItemOption = { value: string; label: string }

export function userSelectItems(
  users: Pick<User, 'id' | 'name' | 'email'>[]
): SelectItemOption[] {
  return users.map((user) => ({
    value: user.id,
    label: user.name?.trim() || user.email,
  }))
}

export function visitorSelectItems(
  visitors: Pick<Visitor, 'id' | 'name' | 'company'>[],
  includeEmpty = true
): SelectItemOption[] {
  const items = visitors.map((visitor) => ({
    value: visitor.id,
    label: visitor.company ? `${visitor.name} (${visitor.company})` : visitor.name,
  }))

  return includeEmpty ? [{ value: '', label: '없음' }, ...items] : items
}

export function labelFromItems(
  items: SelectItemOption[],
  value: string | null | undefined,
  fallback = ''
): string {
  if (!value) return fallback
  return items.find((item) => item.value === value)?.label ?? fallback
}
