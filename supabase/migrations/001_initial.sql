-- ============================================================
-- RentCheck — Initial Database Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- Table: zones
-- Reference price per m² by zone
-- ============================================================
create table if not exists zones (
  id           text primary key,
  city         text not null,
  zone_name    text not null,
  center_lat   double precision not null,
  center_lng   double precision not null,
  eur_m2_ref   double precision not null,
  created_at   timestamptz default now()
);

-- ============================================================
-- Table: listings_analyses
-- Stores every analysis performed by users
-- ============================================================
create table if not exists listings_analyses (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz default now(),
  user_id          uuid references auth.users(id) on delete set null,

  -- Source
  source_url       text,

  -- Location
  city             text not null,
  zone_name        text not null,

  -- Listing data
  price_monthly    integer not null,
  sqm              integer not null,
  bedrooms         smallint not null default 1,
  bathrooms        smallint not null default 1,
  floor            smallint not null default 1,
  has_elevator     boolean not null default false,
  has_terrace      boolean not null default false,
  furnished        boolean not null default false,
  condition        text not null default 'bueno',
  bills_included   boolean not null default false,

  -- Analysis results
  eur_m2_ref       double precision not null,
  estimated_price  integer not null,
  estimated_min    integer not null,
  estimated_max    integer not null,
  difference_pct   double precision not null,
  label            text not null check (label in ('BAJO', 'MEDIO', 'ELEVADO')),
  explanation      jsonb not null default '[]'::jsonb
);

-- Indexes
create index if not exists idx_analyses_zone on listings_analyses(zone_name);
create index if not exists idx_analyses_label on listings_analyses(label);
create index if not exists idx_analyses_user on listings_analyses(user_id);
create index if not exists idx_analyses_created on listings_analyses(created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table zones enable row level security;
alter table listings_analyses enable row level security;

-- zones: readable by everyone
create policy "zones_public_read" on zones
  for select using (true);

-- listings_analyses: anyone can read (for radar)
create policy "analyses_public_read" on listings_analyses
  for select using (true);

-- listings_analyses: anyone can insert (anonymous analyses)
create policy "analyses_public_insert" on listings_analyses
  for insert with check (true);

-- listings_analyses: users can only update/delete their own
create policy "analyses_user_update" on listings_analyses
  for update using (auth.uid() = user_id);

create policy "analyses_user_delete" on listings_analyses
  for delete using (auth.uid() = user_id);

-- ============================================================
-- Seed: Barcelona zones
-- ============================================================
insert into zones (id, city, zone_name, center_lat, center_lng, eur_m2_ref)
values
  ('bcn-eixample',    'barcelona', 'Eixample',    41.3878, 2.1654, 20.5),
  ('bcn-gracia',      'barcelona', 'Gràcia',      41.4025, 2.1567, 18.8),
  ('bcn-sants',       'barcelona', 'Sants',       41.3752, 2.1366, 16.2),
  ('bcn-sant-marti',  'barcelona', 'Sant Martí',  41.4151, 2.2053, 17.5),
  ('bcn-ciutat-vella','barcelona', 'Ciutat Vella',41.3825, 2.1770, 19.2),
  ('bcn-sarria',      'barcelona', 'Sarrià',      41.3993, 2.1199, 22.1),
  ('bcn-les-corts',   'barcelona', 'Les Corts',   41.3842, 2.1309, 19.8),
  ('bcn-horta',       'barcelona', 'Horta',       41.4278, 2.1623, 14.5),
  ('bcn-nou-barris',  'barcelona', 'Nou Barris',  41.4398, 2.1769, 13.2),
  ('bcn-sant-andreu', 'barcelona', 'Sant Andreu', 41.4337, 2.1893, 15.1)
on conflict (id) do nothing;
