# visitor-app — Phase 4

현재 Phase: **Phase 4 (운영화)**  
시작일: 2026-06-08

---

## Phase 4 체크리스트

### Module 1: 감사 로그 완성
- [ ] `supabase/migrations/010_phase4_audit_soft_delete.sql`
- [ ] `src/lib/audit.ts` — `logAudit()` helper
- [ ] 모든 민감 액션에 logAudit 적용 + 파일 다운로드 API
- [ ] `pnpm build` 성공

### Module 2: 데이터 보관 기간 정책
- [ ] `src/app/api/cron/data-retention/route.ts`
- [ ] `vercel.json` cron `0 0 * * *` 추가
- [ ] soft delete → 6개월 후 영구 삭제
- [ ] `pnpm build` 성공

### Module 3: 모니터링
- [ ] `src/app/api/health/route.ts`
- [ ] Error boundary 컴포넌트
- [ ] `pnpm build` 성공
