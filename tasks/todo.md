# visitor-app — Phase 3

현재 Phase: **Phase 3 (분석)**  
시작일: 2026-06-08

---

## Phase 3 체크리스트

### Module 1: 보고서/통계 대시보드
- [ ] `recharts` 설치
- [ ] `src/app/api/reports/stats/route.ts`
- [ ] `src/app/(dashboard)/reports/page.tsx` + 차트 컴포넌트
- [ ] RBAC: `reports.read` (admin, manager)
- [ ] 사이드바 네비게이션 추가
- [ ] `pnpm build` 성공

### Module 2: 화상회의 연동 (Zoom 링크)
- [ ] `supabase/migrations/008_phase3_zoom_link.sql`
- [ ] Meeting 타입 + MeetingForm + API 업데이트
- [ ] 미팅 상세 페이지 Zoom 참여 버튼
- [ ] `pnpm build` 성공

### Module 3: 자동 전사 stub
- [ ] `supabase/migrations/009_phase3_meeting_recordings.sql`
- [ ] `src/lib/transcription/whisper.ts` (TODO stub)
- [ ] `src/app/api/meeting-recordings/route.ts`
- [ ] `src/components/meetings/RecordingUpload.tsx`
- [ ] `pnpm build` 성공
