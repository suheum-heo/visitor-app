# visitor-app — Phase 3

현재 Phase: **Phase 3 (분석)**  
시작일: 2026-06-08

---

## Phase 3 체크리스트

### Module 1: 보고서/통계 대시보드
- [x] `recharts` 설치
- [x] `src/app/api/reports/stats/route.ts`
- [x] `src/app/(dashboard)/reports/page.tsx` + 차트 컴포넌트
- [x] RBAC: `reports.read` (admin, manager)
- [x] 사이드바 네비게이션 추가
- [x] `pnpm build` 성공

### Module 2: 화상회의 연동 (Zoom 링크)
- [x] `supabase/migrations/008_phase3_zoom_link.sql`
- [x] Meeting 타입 + MeetingForm + API 업데이트
- [x] 미팅 상세 페이지 Zoom 참여 버튼
- [x] `pnpm build` 성공

### Module 3: 자동 전사 stub
- [x] `supabase/migrations/009_phase3_meeting_recordings.sql`
- [x] `src/lib/transcription/whisper.ts` (TODO stub)
- [x] `src/app/api/meeting-recordings/route.ts`
- [x] `src/components/meetings/RecordingUpload.tsx`
- [x] `pnpm build` 성공

### 배포 전 확인
- [ ] Neon에 migration 008–009 적용
- [ ] OPENAI_API_KEY 설정 (Whisper 연동 시)

---

## Review Section

**Phase 3 완료 (2026-06-08)**

3개 모듈 모두 구현 및 `pnpm build` 통과. 커밋 3건 push 완료:

1. `feat(reports)` — recharts 통계 대시보드 `/reports`
2. `feat(meetings)` — Zoom 링크 필드 + 참여 버튼
3. `feat(recordings)` — 녹음 업로드 R2 + 전사 stub

**다음 단계:** migration 008–009 적용, Whisper API 실제 연동.
