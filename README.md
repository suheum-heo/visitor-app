# visitor-app

통합 방문객 및 미팅 관리 시스템. 방문객 등록·조회, 미팅 기록, 출입 기록, 명함 OCR, 통합 검색, 보고서를 하나의 플랫폼에서 관리합니다.

## Tech Stack

- **Framework:** Next.js 16 (App Router) · TypeScript · React 19
- **Database:** PostgreSQL (Neon) · `postgres.js`
- **Auth:** NextAuth v5 · Google OAuth
- **Storage:** Cloudflare R2 (`@aws-sdk/client-s3`)
- **OCR:** Google Gemini Vision API
- **Charts:** Recharts
- **Styling:** Tailwind CSS 4 · Pretendard font
- **Deploy:** Vercel

## Features

| Module | Description |
|--------|-------------|
| 방문객 관리 | 등록·수정·조회, 담당자 지정, soft delete |
| 미팅 관리 | 일정·장소·상태, Zoom 링크, 문서 첨부 |
| 명함 OCR | Gemini Vision으로 명함 인식 → 사용자 검토 후 저장 |
| 출입 기록 | 수동 입력 + 경비 시스템 동기화 (cron) |
| 통합 검색 | PostgreSQL FTS (`to_tsvector` / `plainto_tsquery`) |
| 보고서 | 월별 방문객·미팅, 회사별 분포, 피크 시간대 |
| 녹음 업로드 | R2 저장 + 전사 상태 관리 (Whisper stub) |
| 감사 로그 | 민감 액션 IP·User-Agent 포함 기록 |
| 데이터 보관 | cron으로 오래된 출입·감사·soft-delete 데이터 정리 |
| 모니터링 | `/api/health` (DB·R2 연결 확인), Error boundary |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database (e.g. [Neon](https://neon.tech))
- Google OAuth credentials
- Cloudflare R2 bucket
- Google Gemini API key (명함 OCR)

### 1. Clone & install

```bash
git clone <repo-url>
cd visitor-app
pnpm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth app credentials |
| `AUTH_SECRET` | NextAuth secret (`openssl rand -base64 32`) |
| `CLOUDFLARE_R2_*` | R2 account, keys, bucket, public URL |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Optional; defaults to `gemini-2.5-flash-lite` with fallbacks |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `http://localhost:3000`) |
| `CRON_SECRET` | Secret for Vercel cron endpoints |

### 3. Database migrations

Run migrations in order against your PostgreSQL database:

```bash
# Example with psql
for f in db/migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

Migrations: `001` initial schema → `010` audit log & soft delete.

### 4. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with Google; new users are created with the `staff` role by default.

### 5. Build

```bash
pnpm build
pnpm start
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/       # Public login page
│   ├── (dashboard)/        # Protected routes (session required)
│   └── api/                # Route handlers
├── components/             # UI & feature components
├── lib/
│   ├── auth/               # RBAC (rbac.ts server / permissions.ts client)
│   ├── storage/r2.ts       # Cloudflare R2 helpers
│   ├── ocr/businessCard.ts # Gemini Vision OCR
│   └── audit.ts            # Audit log helper
├── types/                  # Shared TypeScript types
└── constants/              # Roles, status codes

db/migrations/              # SQL migrations (run in order)
```

## Roles & Permissions

| Role | Access |
|------|--------|
| **Admin** | Full access, user management |
| **Manager** | Visitors, meetings, reports |
| **Staff** | Own meetings, basic read |
| **Security** | Access records, visitor reception |
| **Guest** | Limited read-only |

Permissions are enforced in three layers: UI, API routes (`checkPermission`), and database RLS policies.

## Cron Jobs

Configured in `vercel.json`:

| Schedule | Endpoint | Purpose |
|----------|----------|---------|
| `0 9 * * *` (daily 9am) | `/api/cron/sync-access` | Sync access records from security system |
| `0 0 * * *` (daily midnight) | `/api/cron/data-retention` | Purge old access records, audit logs, soft-deleted data |

Both endpoints require the `x-cron-secret` header matching `CRON_SECRET`.

## Deployment (Vercel)

1. Connect the repository to Vercel.
2. Set all environment variables from `.env.example`.
3. Apply database migrations to production PostgreSQL.
4. Deploy — cron jobs are picked up from `vercel.json`.

Health check: `GET /api/health` returns DB and R2 connectivity status (no auth required).

## License

Private — internal use only.
