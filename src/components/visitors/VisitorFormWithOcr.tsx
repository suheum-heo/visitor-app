'use client'

import { useState } from 'react'
import BusinessCardOcr, { type BusinessCardExtracted } from '@/components/business-cards/BusinessCardOcr'
import VisitorForm, { type VisitorFormOcrPrefill } from '@/components/visitors/VisitorForm'
import type { Visitor, User } from '@/types'

interface VisitorFormWithOcrProps {
  visitor?: Visitor
  hosts: Pick<User, 'id' | 'name' | 'email'>[]
  currentUserId: string
  showOcr?: boolean
}

export default function VisitorFormWithOcr({
  visitor,
  hosts,
  currentUserId,
  showOcr = true,
}: VisitorFormWithOcrProps) {
  const [ocrPrefill, setOcrPrefill] = useState<VisitorFormOcrPrefill | null>(null)

  function handleExtracted(data: BusinessCardExtracted) {
    setOcrPrefill({
      name: data.name || undefined,
      company: data.company || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
    })
  }

  return (
    <div className="space-y-6">
      {showOcr && (
        <BusinessCardOcr
          visitorId={visitor?.id}
          onExtracted={handleExtracted}
        />
      )}
      <VisitorForm
        visitor={visitor}
        hosts={hosts}
        currentUserId={currentUserId}
        ocrPrefill={ocrPrefill}
      />
    </div>
  )
}
