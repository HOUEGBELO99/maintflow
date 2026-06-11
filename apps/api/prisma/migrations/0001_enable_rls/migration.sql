-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security (defense in depth, in addition to the API's CASL checks).
-- Strategy: every tenant table carries `siteId`. A user may only see rows whose
-- siteId matches the `site_id` claim baked into their Supabase JWT.
--
-- This migration is a TEMPLATE — adjust the claim path to match how you store
-- site_id in the JWT (custom claim via a Supabase auth hook is recommended).
-- Apply manually in Supabase SQL editor, or keep it under Prisma migrations.
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: read the current tenant from the JWT custom claim.
create or replace function public.current_site_id()
returns uuid
language sql stable
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::json ->> 'site_id',
    ''
  )::uuid
$$;

-- Enable + force RLS on tenant tables.
do $$
declare t text;
begin
  foreach t in array array[
    'machines','faults','interventions','parts','plan_rules',
    'notifications','invitations','users'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);

    -- Read/write only within your own site.
    execute format($f$
      create policy %1$s_tenant_isolation on public.%1$s
        using ("siteId" = public.current_site_id())
        with check ("siteId" = public.current_site_id());
    $f$, t);
  end loop;
end $$;

-- The service-role key (used by the NestJS API) bypasses RLS by design.
-- Clients using the anon key are always constrained by the policies above.
