# CLAUDE.md — visitor-app

> 통합 방문객 및 미팅 관리 시스템  
> Stack: Next.js (App Router) · TypeScript · Supabase (PostgreSQL + Auth + Storage) · Vercel · Tailwind CSS

---

## Project Context

방문객 등록/조회, 미팅 기록, 출입 기록 연동, 명함 OCR, 통합 검색을 하나의 플랫폼으로 관리하는 사내 시스템.  
Google OAuth 기반 인증, RBAC 권한(Admin / Manager / Staff / Security / Guest), Supabase RLS가 핵심 보안 레이어.

```
src/app/(dashboard)/     ← 보호된 라우트 (로그인 필수)
src/app/api/             ← Route Handlers (서버 전용 로직)
src/lib/supabase/        ← client.ts(브라우저) / server.ts(서버) 분리 필수
supabase/migrations/     ← 스키마 변경은 반드시 migration 파일로
tasks/                   ← todo.md, lessons.md 항상 최신 유지
```

---

## Workflow Orchestration

### 1. Plan Node Default
- 3단계 이상이거나 아키텍처 결정이 수반되는 작업은 반드시 plan mode 진입
- 막히면 즉시 STOP → `tasks/todo.md` 재작성 후 재시작, 억지로 밀지 않기
- 검증 단계도 plan에 포함 (빌드만 계획하지 말 것)
- DB 스키마·RLS·API 설계는 코드보다 spec을 먼저 작성

### 2. Subagent Strategy
- 메인 컨텍스트 보호를 위해 서브에이전트 적극 활용
- 아래 작업은 서브에이전트로 분리:
  - Supabase migration SQL 작성 및 검증
  - OCR 로직 탐색 (Claude Vision API vs Google Vision)
  - 경비 시스템 API 스펙 분석
  - 복잡한 RBAC 정책 작성
- 서브에이전트는 역할 하나에 집중, 결과만 메인으로 반환

### 3. Self-Improvement Loop
- 사용자 교정 발생 즉시 → `tasks/lessons.md` 업데이트
- 같은 실수 재발 방지 패턴을 규칙 형태로 기록
- 세션 시작 시 `tasks/lessons.md` 먼저 리뷰
- 실수율이 줄 때까지 lessons 반복 정제

### 4. Verification Before Done
- 작업 완료 전 반드시 증명: `npm run build` 성공 + 브라우저 동작 확인
- API route 변경 시: curl 또는 테스트로 응답 직접 확인
- RLS 정책 변경 시: 각 역할(Admin/Staff/Security)로 접근 시나리오 검증
- "Staff engineer가 PR 승인할까?" 자문 후 완료 처리

### 5. Demand Elegance (Balanced)
- 비자명한 변경은 "더 우아한 방법이 있는가?" 자문
- 억지 fix 느낌이면 → "지금 아는 모든 것을 기반으로 우아한 솔루션 구현"
- 단순 명확한 수정은 over-engineering 금지
- 발표 전 스스로 코드 챌린지

### 6. Autonomous Bug Fixing
- 버그 리포트 받으면 바로 수정, 손잡기 요청 없이
- 로그, 에러, 실패 테스트를 직접 파악 후 해결
- 사용자 컨텍스트 스위칭 0회 목표
- CI 실패 테스트 → 지시 없이 직접 수정

---

## Task Management

1. **Plan First**: `tasks/todo.md`에 체크 가능한 항목으로 계획 작성
2. **Verify Plan**: 구현 시작 전 계획 확인
3. **Track Progress**: 완료 항목 즉시 체크
4. **Explain Changes**: 각 단계마다 high-level 요약
5. **Document Results**: `tasks/todo.md` 하단에 review 섹션 추가
6. **Capture Lessons**: 교정 후 `tasks/lessons.md` 업데이트
7. **Commit & Push**: 작업 단위 완료 시 반드시 commit + push (아래 규칙 참고)

---

## Commit & Push Rules

작업 단위 완료마다 commit + push. 절대 쌓아두지 않는다.

```bash
git add .
git commit -m "<type>(<scope>): <한글 또는 영문 요약>"
git push origin main
```

### Commit Type
| type | 사용 시점 |
|------|-----------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `schema` | Supabase migration 추가/변경 |
| `refactor` | 동작 변경 없는 구조 개선 |
| `style` | UI/CSS 변경 |
| `chore` | 설정, 패키지, 문서 변경 |

### Commit 예시
```
feat(visitors): 방문객 등록 CRUD API 및 UI 구현
schema(access): access_records 테이블 + RLS 정책 추가
fix(auth): 서버 컴포넌트에서 세션 만료 시 리다이렉트 누락 수정
chore: CLAUDE.md 초기 작성
```

### Push 타이밍
- migration 파일 추가 후
- API route 신규 구현 후
- 페이지/컴포넌트 단위 완성 후
- 버그 수정 후
- `.env.example` 항목 추가 후 (값은 절대 커밋 금지)

---

## Core Principles

- **Simplicity First**: 변경은 최소한으로. 영향 범위를 의도적으로 좁혀라.
- **No Laziness**: 근본 원인을 찾아라. 임시방편 없음. 시니어 기준 적용.
- **Minimal Impact**: 필요한 것만 건드려라. 불필요한 버그 유입 금지.
- **RLS is Law**: Supabase Row Level Security는 선택이 아닌 필수. 화면 권한 숨김만으로 끝내지 않는다.
- **Never Commit Secrets**: `.env`, API 키, DB 비밀번호는 절대 Git에 올리지 않는다. `.env.example`에 키 이름만.
- **Code is Code, Data is Data**: 공장·부서·상태코드 등 기준정보는 코드에 하드코딩 금지. DB에서 읽는다.

---

## Project-Specific Rules

### Supabase

```typescript
// ✅ 서버 컴포넌트 / API Route
import { createServerClient } from '@/lib/supabase/server'

// ✅ 클라이언트 컴포넌트
import { createBrowserClient } from '@/lib/supabase/client'

// ❌ 서버에서 브라우저 클라이언트 절대 사용 금지
```

- 스키마 변경은 항상 `supabase/migrations/NNN_description.sql` 파일로
- 마이그레이션 번호는 3자리 제로패딩: `001`, `002`, ...
- 모든 테이블에 RLS 활성화 + 역할별 policy 명시
- `updated_at` 자동 갱신 트리거 모든 테이블에 적용

### Authentication & RBAC

```
역할 계층: Admin > Manager > Staff / Security > Guest

Admin    : 모든 기능, 사용자 관리, 시스템 설정
Manager  : 방문객·미팅 전체 관리, 보고서 조회
Staff    : 본인 미팅만 관리, 기본 조회
Security : 출입 기록 입력, 방문객 접수
Guest    : 제한 읽기 전용
```

- 권한 검사는 UI(버튼 숨김) + API Route + RLS **3중으로**
- `lib/auth/rbac.ts`의 `checkPermission()` 함수를 API route 최상단에서 호출
- Google 로그인 후 `users` 테이블에서 역할 조회, 토큰에만 의존 금지

### API Route 작성 규칙

```typescript
// 모든 API Route 기본 구조
export async function GET(request: Request) {
  const supabase = await createServerClient()
  
  // 1. 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  // 2. 권한 확인
  const allowed = await checkPermission(user.id, 'resource.action')
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 })
  
  // 3. 비즈니스 로직
  // ...
  
  // 4. 응답
  return Response.json(data)
}
```

- `try/catch`로 에러 반드시 처리, 스택 트레이스 클라이언트에 노출 금지
- 감사 로그: 방문객 등록/수정/삭제, 민감 정보 조회, 파일 다운로드 시 `audit_logs` 테이블에 기록

### 파일 업로드

- Supabase Storage 버킷: `documents`, `business-cards`
- DB에는 파일 경로/URL만 저장, 파일 본체는 Storage에
- 업로드 전 파일 크기·타입 서버에서 검증
- 녹음·영상 파일은 스트리밍 URL 생성, 직접 다운로드 기본 비활성화

### 명함 OCR

- `lib/ocr/businessCard.ts`에서 Claude Vision API 호출
- OCR 결과는 사용자가 반드시 검토·확정 후 저장 (자동 저장 금지)
- 명함 이미지는 `business-cards` 버킷에 저장 후 URL을 `business_cards` 테이블에 기록

### 출입 기록 동기화

- `api/cron/sync-access/route.ts` → Vercel Cron (매 1시간)
- 동기화 결과는 `sync_logs` 테이블에 기록 (성공/실패/변경 건수)
- 경비 시스템 API 장애 시 graceful degradation: 로그만 남기고 서비스 중단 없음
- 방문객 매칭 실패 건은 `access_records.visitor_id = NULL`로 저장 후 관리자 검토 대기

### 환경변수

`.env.example` 항목 추가 시 바로 커밋. 실제 값은 Vercel 대시보드에서만 관리.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
SECURITY_SYSTEM_API_URL=
SECURITY_SYSTEM_API_KEY=
CRON_SECRET=
```

---

## File Structure Quick Reference

```
src/
├── app/
│   ├── (auth)/login/          ← 공개 라우트
│   ├── (dashboard)/           ← 보호 라우트 (layout.tsx에서 세션 검사)
│   └── api/                   ← Route Handlers (서버 전용)
├── components/
│   ├── ui/                    ← 재사용 공통 컴포넌트
│   └── [feature]/             ← 기능별 컴포넌트
├── lib/
│   ├── supabase/              ← client.ts / server.ts / middleware.ts
│   ├── auth/rbac.ts           ← 권한 검사 유틸
│   ├── storage/upload.ts      ← 파일 업로드 헬퍼
│   └── ocr/businessCard.ts    ← 명함 OCR
├── hooks/                     ← React Query 기반 데이터 훅
├── types/                     ← Supabase gen types + 커스텀 타입
└── constants/                 ← ROLES, STATUS_CODES, VISITOR_TYPES

supabase/
├── migrations/                ← NNN_description.sql (순서 엄수)
└── seed/demo_data.sql

tasks/
├── todo.md                    ← 현재 작업 계획 (항상 최신)
└── lessons.md                 ← 교정 패턴 누적
```

---

## Phase Roadmap

```
Phase 1 (MVP)     : Supabase 스키마 → Auth → 방문객 CRUD → 미팅 CRUD → 대시보드 → Vercel 배포
Phase 2 (파일/연동): 파일 업로드 → 명함 OCR → 출입 기록 모듈 → 통합 검색
Phase 3 (분석)    : 보고서/통계 → 화상회의 연동 → 자동 전사
Phase 4 (운영화)  : 감사 로그 완성 → 개인정보 보관기간 정책 → 모니터링
```

현재 Phase는 `tasks/todo.md` 상단에 표시.
