create table if not exists public.liva_snapshots (
  workspace_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.liva_snapshots enable row level security;
grant select, insert, update on table public.liva_snapshots to anon, authenticated;

drop policy if exists "workspace can read its snapshot" on public.liva_snapshots;
create policy "workspace can read its snapshot"
on public.liva_snapshots for select
to anon, authenticated
using (
  workspace_id = coalesce(
    current_setting('request.headers', true)::json ->> 'x-workspace-id',
    ''
  )
);

drop policy if exists "workspace can create its snapshot" on public.liva_snapshots;
create policy "workspace can create its snapshot"
on public.liva_snapshots for insert
to anon, authenticated
with check (
  workspace_id = coalesce(
    current_setting('request.headers', true)::json ->> 'x-workspace-id',
    ''
  )
);

drop policy if exists "workspace can update its snapshot" on public.liva_snapshots;
create policy "workspace can update its snapshot"
on public.liva_snapshots for update
to anon, authenticated
using (
  workspace_id = coalesce(
    current_setting('request.headers', true)::json ->> 'x-workspace-id',
    ''
  )
)
with check (
  workspace_id = coalesce(
    current_setting('request.headers', true)::json ->> 'x-workspace-id',
    ''
  )
);
