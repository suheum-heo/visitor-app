# visitor-app — Phase 4

현재 Phase: **Phase 4 (운영화)**  
시작일: 2026-06-08

---

## Phase 4 체크리스트

### Module 1: 감사 로그 완성
- [x] `supabase/migrations/010_phase4_audit_soft_delete.sql`
- [x] `src/lib/audit.ts` — `logAudit()` helper
- [x] 모든 민감 액션에 logAudit 적용 + 파일 다운로드 API
- [x] `pnpm build` 성공

### Module 2: 데이터 보관 기간 정책
- [x] `src/app/api/cron/data-retention/route.ts`
- [x] `vercel.json` cron `0 0 * * *` 추가
- [x] soft delete → 6개월 후 영구 삭제
- [x] `pnpm build` 성공

### Module 3: 모니터링
- [x] `src/app/api/health/route.ts`
- [x] Error boundary 컴포넌트
- [x] `pnpm build` 성공

### 배포 전 확인
- [ ] Neon에 migration 010 적용
- [ ] CRON_SECRET 설정 (data-retention cron)

---

## Review Section

**Phase 4 완료 (2026-06-08)**

3개 모듈 모두 구현 및 `pnpm build` 통과. 커밋 2건 push:

1. `feat(audit)` — logAudit + soft delete + data-retention cron
2. `feat(monitoring)` — /api/health + error boundaries

**다음 단계:** migration 010 적용, health/cron 엔드포인트 운영 확인.
