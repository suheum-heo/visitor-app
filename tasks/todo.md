# visitor-app — Phase 1 MVP

현재 Phase: **Phase 1 (MVP)**  
시작일: 2026-06-08

---

## Phase 1 체크리스트

### Step 1: Next.js 프로젝트 초기화
- [x] pnpm create next-app 실행
- [x] 의존성 설치 (@supabase/supabase-js, @supabase/ssr)
- [x] shadcn/ui 초기화 + 컴포넌트 추가

### Step 2: 환경변수
- [x] .env.example 생성 (키 이름만)
- [ ] .env.local 생성 (실제 값 — gitignore, Supabase 생성 후)

### Step 3: Supabase 클라이언트
- [x] src/lib/supabase/client.ts
- [x] src/lib/supabase/server.ts
- [x] src/proxy.ts (Next.js 16: middleware → proxy)

### Step 4: DB 스키마 (Migrations)
- [x] supabase/migrations/001_initial_schema.sql
- [x] supabase/migrations/002_rls_policies.sql
- [x] supabase/migrations/003_triggers.sql

### Step 5: RBAC
- [x] src/lib/auth/rbac.ts

### Step 6: Auth
- [x] src/app/(auth)/login/page.tsx
- [x] src/app/auth/callback/route.ts
- [x] src/app/(dashboard)/layout.tsx (세션 가드)

### Step 7: 타입 정의
- [x] src/types/index.ts

### Step 8: Visitors CRUD
- [x] src/app/api/visitors/route.ts (GET, POST)
- [x] src/app/api/visitors/[id]/route.ts (GET, PATCH, DELETE)
- [x] src/components/visitors/VisitorForm.tsx
- [x] src/components/visitors/VisitorTable.tsx
- [x] src/components/visitors/VisitorStatusBadge.tsx
- [x] src/app/(dashboard)/visitors/page.tsx
- [x] src/app/(dashboard)/visitors/new/page.tsx
- [x] src/app/(dashboard)/visitors/[id]/page.tsx

### Step 9: Meetings CRUD
- [x] src/app/api/meetings/route.ts (GET, POST)
- [x] src/app/api/meetings/[id]/route.ts (GET, PATCH, DELETE)
- [x] src/components/meetings/MeetingForm.tsx
- [x] src/components/meetings/MeetingTable.tsx
- [x] src/app/(dashboard)/meetings/page.tsx
- [x] src/app/(dashboard)/meetings/new/page.tsx
- [x] src/app/(dashboard)/meetings/[id]/page.tsx

### Step 10: 대시보드
- [x] src/app/(dashboard)/page.tsx
- [x] 오늘 방문객 카드, 예정 미팅 카드, 상태별 카드

### Step 11: 검증
- [ ] pnpm build 성공
- [ ] Supabase 프로젝트 생성 + migration 적용
- [ ] Google OAuth 로그인 → 대시보드 진입 확인
- [ ] 방문객 CRUD 동작 확인
- [ ] 미팅 CRUD 동작 확인

### Step 12: 배포
- [ ] vercel.json 작성
- [ ] Vercel 환경변수 설정
- [ ] Preview 배포 확인

---

## Review Section
_(작업 완료 후 작성)_
