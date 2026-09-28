-- À exécuter dans Supabase : Project > SQL Editor > New query > Run

-- 1) Table des studios
create table if not exists studios (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  quartier text not null,
  prix numeric not null default 0,
  unite text not null default 'nuit',
  description text default '',
  image_url text,
  disponible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table studios enable row level security;

-- 2) Tout le monde peut LIRE les studios disponibles (site public)
create policy "Lecture publique des studios disponibles"
  on studios for select
  using (disponible = true);

-- 3) Seuls les utilisateurs connectés (l'administrateur) peuvent tout lire,
--    ajouter, modifier ou supprimer
create policy "Lecture complete pour les administrateurs connectes"
  on studios for select
  to authenticated
  using (true);

create policy "Ecriture reservee aux administrateurs connectes"
  on studios for insert
  to authenticated
  with check (true);

create policy "Modification reservee aux administrateurs connectes"
  on studios for update
  to authenticated
  using (true);

create policy "Suppression reservee aux administrateurs connectes"
  on studios for delete
  to authenticated
  using (true);

-- 4) Stockage des photos : créez un bucket "studio-photos" (Storage > New bucket,
--    cochez "Public bucket"), puis exécutez ceci pour autoriser l'upload
--    uniquement aux administrateurs connectés :

insert into storage.buckets (id, name, public)
values ('studio-photos', 'studio-photos', true)
on conflict (id) do nothing;

create policy "Lecture publique des photos"
  on storage.objects for select
  using (bucket_id = 'studio-photos');

create policy "Upload reserve aux administrateurs connectes"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'studio-photos');

create policy "Suppression photos reservee aux administrateurs connectes"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'studio-photos');

-- 5) Périodes d'indisponibilité (dates où un studio est déjà occupé)
create table if not exists indisponibilites (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  date_debut date not null,
  date_fin date not null,
  note text default '',
  created_at timestamptz not null default now()
);

alter table indisponibilites enable row level security;

-- Tout le monde peut voir les périodes occupées (pour afficher la disponibilité
-- aux visiteurs), mais seul l'administrateur connecté peut les créer ou les
-- supprimer.
create policy "Lecture publique des indisponibilites"
  on indisponibilites for select
  using (true);

create policy "Ecriture indisponibilites reservee aux administrateurs"
  on indisponibilites for insert
  to authenticated
  with check (true);

create policy "Suppression indisponibilites reservee aux administrateurs"
  on indisponibilites for delete
  to authenticated
  using (true);
