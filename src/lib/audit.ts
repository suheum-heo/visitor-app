import sql from '@/lib/db'

export type AuditAction = 'create' | 'update' | 'delete' | 'download' | 'save'

export interface LogAuditParams {
  userId: string
  action: AuditAction
  resourceType: string
  resourceId: string | null
  request?: Request
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
}

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null
  return request.headers.get('x-real-ip')
}

export async function logAudit({
  userId,
  action,
  resourceType,
  resourceId,
  request,
  oldData = null,
  newData = null,
}: LogAuditParams): Promise<void> {
  const ipAddress = request ? getClientIp(request) : null
  const userAgent = request?.headers.get('user-agent') ?? null

  await sql`
    INSERT INTO audit_logs (
      user_id, action, resource_type, resource_id,
      old_data, new_data, ip_address, user_agent
    )
    VALUES (
      ${userId},
      ${action},
      ${resourceType},
      ${resourceId},
      ${oldData ? JSON.stringify(oldData) : null},
      ${newData ? JSON.stringify(newData) : null},
      ${ipAddress},
      ${userAgent}
    )
  `
}
