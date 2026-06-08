# visitor-app — Phase 5

현재 Phase: **Phase 5 (고도화)**  
시작일: 2026-06-08

---

## Phase 5 체크리스트

### Feature 1: 중복 방문객 감지
- [ ] `GET /api/visitors/check-duplicate`
- [ ] 유사도 매칭 lib + VisitorForm 경고 모달
- [ ] `pnpm build` 성공

### Feature 2: 자동 전사 (Google Speech-to-Text)
- [ ] `whisper.ts` → Google Speech REST API
- [ ] meeting-recordings 전사 완료 저장
- [ ] `GOOGLE_SPEECH_API_KEY` in `.env.example`
- [ ] `pnpm build` 성공

### Feature 3: 태그 기반 검색
- [ ] migration 011 tags
- [ ] 등록 폼 태그 UI + search API/페이지 필터
- [ ] `pnpm build` 성공

### Feature 4: 이상 출입 알림
- [ ] 출입 기록 생성 후 이상 탐지
- [ ] Resend 이메일 → admin
- [ ] `RESEND_API_KEY` in `.env.example`
- [ ] `pnpm build` 성공
