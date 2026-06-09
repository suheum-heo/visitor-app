# visitor-app — Phase 5

현재 Phase: **Phase 5 (고도화)**  
시작일: 2026-06-08

---

## Phase 5 체크리스트

### Feature 5: R2 파일 암호화
- [x] `db/migrations/012_phase5_file_encryption.sql`
- [x] AES-256-GCM encrypt/decrypt (`src/lib/storage/encrypt.ts`)
- [x] documents·meeting_recordings 업로드 암호화 + 다운로드 복호화
- [x] `ENCRYPTION_KEY` in `.env.example`
- [x] `pnpm build` 성공

### 배포 전 확인
- [ ] Neon에 migration 011, 012 적용
- [ ] `ENCRYPTION_KEY` 설정 (`openssl rand -hex 32`)
- [ ] `RESEND_API_KEY`, `RESEND_FROM_EMAIL` 설정
