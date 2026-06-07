-- ============================================================
-- 002_rls_policies.sql
-- RLS 활성화 및 역할별 정책 설정
-- ============================================================

-- RLS 활성화
alter table public.users       enable row level security;
alter table public.visitors    enable row level security;
alter table public.meetings    enable row level security;
alter table public.audit_logs  enable row level security;

-- ─────────────────────────────────────
-- 헬퍼 함수: 현재 사용자 역할 조회
-- ─────────────────────────────────────
create or replace function public.get_user_role()
returns text
language sql
security definer
stable
as $$
  select role from public.users where id = auth.uid();
$$;

-- ─────────────────────────────────────
-- users 정책
-- ─────────────────────────────────────

-- 본인 정보 조회
create policy "users: self read"
  on public.users for select
  using (id = auth.uid());

-- admin/manager 전체 조회
create policy "users: admin/manager read all"
  on public.users for select
  using (public.get_user_role() in ('admin','manager'));

-- 본인 정보 수정
create policy "users: self update"
  on public.users for update
  using (id = auth.uid())
  with check (
    -- 역할 변경은 admin만 허용 (본인이 직접 변경 불가)
    id = auth.uid() and role = (select role from public.users where id = auth.uid())
  );

-- admin: 사용자 관리
create policy "users: admin manage"
  on public.users for all
  using (public.get_user_role() = 'admin');

-- ─────────────────────────────────────
-- visitors 정책
-- ─────────────────────────────────────

-- admin/manager/security: 전체 조회
create policy "visitors: admin/manager/security read all"
  on public.visitors for select
  using (public.get_user_role() in ('admin','manager','security'));

-- staff: 본인이 등록하거나 host인 것만 조회
create policy "visitors: staff read own"
  on public.visitors for select
  using (
    public.get_user_role() = 'staff'
    and (host_id = auth.uid() or created_by = auth.uid())
  );

-- 등록 (admin/manager/staff/security)
create policy "visitors: create"
  on public.visitors for insert
  with check (
    public.get_user_role() in ('admin','manager','staff','security')
    and created_by = auth.uid()
  );

-- admin/manager/security: 전체 수정
create policy "visitors: admin/manager/security update all"
  on public.visitors for update
  using (public.get_user_role() in ('admin','manager','security'));

-- staff: 본인 것만 수정
create policy "visitors: staff update own"
  on public.visitors for update
  using (
    public.get_user_role() = 'staff'
    and (host_id = auth.uid() or created_by = auth.uid())
  );

-- admin/manager: 삭제
create policy "visitors: admin/manager delete"
  on public.visitors for delete
  using (public.get_user_role() in ('admin','manager'));

-- ─────────────────────────────────────
-- meetings 정책
-- ─────────────────────────────────────

-- admin/manager: 전체 조회
create policy "meetings: admin/manager read all"
  on public.meetings for select
  using (public.get_user_role() in ('admin','manager'));

-- staff: 본인 것만 조회
create policy "meetings: staff read own"
  on public.meetings for select
  using (
    public.get_user_role() = 'staff'
    and (host_id = auth.uid() or created_by = auth.uid())
  );

-- 등록 (admin/manager/staff)
create policy "meetings: create"
  on public.meetings for insert
  with check (
    public.get_user_role() in ('admin','manager','staff')
    and created_by = auth.uid()
  );

-- admin/manager: 전체 수정
create policy "meetings: admin/manager update all"
  on public.meetings for update
  using (public.get_user_role() in ('admin','manager'));

-- staff: 본인 것만 수정
create policy "meetings: staff update own"
  on public.meetings for update
  using (
    public.get_user_role() = 'staff'
    and (host_id = auth.uid() or created_by = auth.uid())
  );

-- admin/manager: 삭제
create policy "meetings: admin/manager delete"
  on public.meetings for delete
  using (public.get_user_role() in ('admin','manager'));

-- ─────────────────────────────────────
-- audit_logs 정책
-- ─────────────────────────────────────

-- 삽입: 서비스 롤만 (API Route에서 service role로 기록)
-- 조회: admin/manager
create policy "audit_logs: admin/manager read"
  on public.audit_logs for select
  using (public.get_user_role() in ('admin','manager'));
