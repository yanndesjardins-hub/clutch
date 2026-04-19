-- ═══════════════════════════════════════════════════════════════════
--  HOOPS CUP — Schéma Supabase
--  Colle ce fichier dans : Supabase Dashboard > SQL Editor > Run
-- ═══════════════════════════════════════════════════════════════════

-- ── Extensions ───────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Profiles ─────────────────────────────────────────────────────────
-- Stocke le pseudo de chaque utilisateur (lié à auth.users)
create table if not exists profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text not null,
  created_at   timestamptz default now()
);

-- Crée le profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Groups ───────────────────────────────────────────────────────────
create table if not exists groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique not null default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz default now()
);

-- ── Group Members ─────────────────────────────────────────────────────
create table if not exists group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid references groups(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  joined_at  timestamptz default now(),
  unique(group_id, user_id)
);

-- ── Predictions ───────────────────────────────────────────────────────
-- series_key : ex 'east_r1_0', 'west_r2_1', 'finals_0'
-- type       : 'initial' (avant deadline) | 'series' (avant game 1 de la série)
create table if not exists predictions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id) on delete cascade,
  group_id         uuid references groups(id) on delete cascade,
  series_key       text not null,
  type             text not null check (type in ('initial', 'series')),
  predicted_winner text,                -- abbr de l'équipe (ex: 'BOS')
  predicted_games  int  check (predicted_games between 4 and 7),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique(user_id, group_id, series_key, type)
);

-- ══════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════════════════

alter table profiles     enable row level security;
alter table groups       enable row level security;
alter table group_members enable row level security;
alter table predictions  enable row level security;

-- profiles : visible par tous les users connectés, modifiable par soi-même
create policy "profiles_select" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- groups : visible par les membres, créable par tout user connecté
create policy "groups_select" on groups for select
  using (id in (select group_id from group_members where user_id = auth.uid()));
create policy "groups_insert" on groups for insert with check (auth.role() = 'authenticated');

-- group_members : visible par les membres du même groupe
create policy "members_select" on group_members for select
  using (group_id in (select group_id from group_members where user_id = auth.uid()));
create policy "members_insert" on group_members for insert with check (auth.role() = 'authenticated');

-- predictions : visibles par les membres du groupe, modifiables par le propriétaire
create policy "predictions_select" on predictions for select
  using (group_id in (select group_id from group_members where user_id = auth.uid()));
create policy "predictions_insert" on predictions for insert
  with check (auth.uid() = user_id);
create policy "predictions_update" on predictions for update
  using (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════════
--  INDEX (performance)
-- ══════════════════════════════════════════════════════════════════════
create index if not exists idx_group_members_user    on group_members(user_id);
create index if not exists idx_group_members_group   on group_members(group_id);
create index if not exists idx_predictions_user      on predictions(user_id);
create index if not exists idx_predictions_group     on predictions(group_id);
create index if not exists idx_predictions_series    on predictions(series_key);
create index if not exists idx_groups_invite_code    on groups(invite_code);
