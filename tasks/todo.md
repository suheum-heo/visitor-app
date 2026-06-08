# visitor-app — Phase 2

현재 Phase: **Phase 2 (파일/연동)**  
시작일: 2026-06-08

---

## Phase 2 체크리스트

### Module 1: 파일 업로드 (R2)
- [x] `supabase/migrations/004_phase2_documents.sql`
- [x] `src/app/api/documents/route.ts` (GET, POST, DELETE)
- [x] `src/components/meetings/DocumentUpload.tsx`
- [x] 미팅 상세 페이지 연동
- [x] `pnpm build` 성공

### Module 2: 명함 OCR
- [x] `supabase/migrations/005_phase2_business_cards.sql`
- [x] `src/lib/ocr/businessCard.ts` (Claude Vision claude-sonnet-4-20250514)
- [x] `src/app/api/business-cards/route.ts` (multipart OCR + JSON 저장)
- [x] `src/components/business-cards/BusinessCardOcr.tsx` (검토 후 저장)
- [x] 방문객/미팅 상세 페이지 연동
- [x] `.env.example` ANTHROPIC_API_KEY 추가
- [x] `pnpm build` 성공

### Module 3: 출입 기록
- [x] `supabase/migrations/006_phase2_access_records.sql`
- [x] `src/app/api/access-records/route.ts` (GET, POST)
- [x] `src/app/api/access-records/sync/route.ts` (stub → sync_logs)
- [x] `src/app/(dashboard)/access-records/page.tsx`
- [x] RBAC: access.read / access.create / access.sync
- [x] `pnpm build` 성공

### Module 4: 통합 검색
- [x] `supabase/migrations/007_phase2_search_fts.sql` (GIN FTS 인덱스)
- [x] `src/app/api/search/route.ts` (to_tsvector / plainto_tsquery)
- [x] `src/app/(dashboard)/search/page.tsx`
- [x] 사이드바 네비게이션 추가
- [x] `pnpm build` 성공

### 배포 전 확인
- [ ] Neon에 migration 004–007 적용
- [ ] R2 버킷 + 환경변수 설정
- [ ] ANTHROPIC_API_KEY 설정
- [ ] CRON_SECRET 설정 (sync stub cron 연동 시)

---

## Review Section

**Phase 2 완료 (2026-06-08)**

4개 모듈 모두 구현 및 `pnpm build` 통과. 커밋 4건 push 완료:

1. `feat(documents)` — R2 문서 업로드 API + 미팅 상세 UI
2. `feat(ocr)` — Claude Vision 명함 OCR + 검토·저장 UI
3. `feat(access)` — 출입 기록 CRUD + sync stub
4. (search 포함) — PostgreSQL FTS 통합 검색 API + `/search` 페이지

**다음 단계:** Neon migration 적용 후 R2/Anthropic 환경변수 설정, 실제 동작 E2E 확인.
