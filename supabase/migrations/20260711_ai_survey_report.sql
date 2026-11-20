-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Adds support for the AI-generated pre-purchase report flow:
-- listing link + seller description + photos -> local AI analysis.

alter table surveys
  add column if not exists listing_url text,
  add column if not exists seller_description text,
  add column if not exists ai_report text,
  add column if not exists status text not null default 'pending';

create table if not exists survey_photos (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  url text not null,
  storage_path text not null,
  ai_analysis text,
  created_at timestamptz not null default now()
);

-- Storage bucket for uploaded photos.
insert into storage.buckets (id, name, public)
values ('survey-photos', 'survey-photos', true)
on conflict (id) do nothing;

-- Allow the app's anon key to upload and read photos.
-- Tighten these policies later if you add authentication.
create policy if not exists "Public read survey photos"
  on storage.objects for select
  using (bucket_id = 'survey-photos');

create policy if not exists "Public upload survey photos"
  on storage.objects for insert
  with check (bucket_id = 'survey-photos');

-- Note: the old `responses` table (per-item checklist scores) is no longer
-- written to by the app now that /survey/new generates an AI report instead
-- of a manual checklist. It's left in place in case you have existing data
-- or want to bring the checklist back later.
