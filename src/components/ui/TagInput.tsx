'use client'

import { useState, type KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { normalizeTag } from '@/lib/tags'
import { X } from 'lucide-react'

interface TagInputProps {
  id?: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export default function TagInput({
  id,
  value,
  onChange,
  placeholder = '태그 입력 후 Enter',
}: TagInputProps) {
  const [input, setInput] = useState('')

  function addTag(raw: string) {
    const tag = normalizeTag(raw)
    if (!tag || value.includes(tag)) return
    onChange([...value, tag])
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="space-y-2">
      <Input
        id={id}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input.trim() && addTag(input)}
        placeholder={placeholder}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                className="rounded-full hover:bg-gray-200 p-0.5"
                onClick={() => removeTag(tag)}
                aria-label={`${tag} 태그 제거`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
