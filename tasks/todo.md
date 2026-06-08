# visitor-app — Phase 5

현재 Phase: **Phase 5 (고도화)**  
시작일: 2026-06-08

---

## Phase 5 체크리스트

### Feature 1: 중복 방문객 감지
- [x] `GET /api/visitors/check-duplicate`
- [x] 유사도 매칭 lib + VisitorForm 경고 모달
- [x] `pnpm build` 성공

### Feature 2: 자동 전사 (Google Speech-to-Text)
- [x] `whisper.ts` → Google Speech REST API
- [x] meeting-recordings 전사 완료 저장
- [x] `GOOGLE_SPEECH_API_KEY` in `.env.example`
- [x] `pnpm build` 성공

### Feature 3: 태그 기반 검색
- [x] migration 011 tags
- [x] 등록 폼 태그 UI + search API/페이지 필터
- [x] `pnpm build` 성공

### Feature 4: 이상 출입 알림
- [x] 출입 기록 생성 후 이상 탐지
- [x] Resend 이메일 → admin
- [x] `RESEND_API_KEY` in `.env.example`
- [x] `pnpm build` 성공

### 배포 전 확인
- [ ] Neon에 migration 011 적용
- [ ] `GOOGLE_SPEECH_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` 설정

---

## Review Section

**Phase 5 완료 (2026-06-08)**

4개 기능 구현 및 `pnpm build` 통과. 커밋 4건 push:

1. `feat(visitors)` — 중복 방문객 유사도 검사
2. `feat(recordings)` — Google Speech-to-Text 전사
3. `feat(search)` — 태그 컬럼 및 필터 검색
4. `feat(access)` — 이상 출입 Resend 알림
