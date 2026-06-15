'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { projectSelectItems } from '@/lib/select-items'
import type { Project } from '@/types'

interface ProjectSelectProps {
  value: string
  onChange: (projectId: string) => void
  label?: string
}

export default function ProjectSelect({ value, onChange, label = '프로젝트 (선택)' }: ProjectSelectProps) {
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name' | 'company'>[]>([])
  const items = projectSelectItems(projects)

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((json) => setProjects(json.data ?? []))
      .catch(() => setProjects([]))
  }, [])

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? '')} items={items}>
        <SelectTrigger>
          <SelectValue placeholder="없음" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">없음</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.company ? `${p.name} (${p.company})` : p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
