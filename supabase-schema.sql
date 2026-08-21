-- À copier-coller une fois dans Supabase → SQL Editor → Run
-- Crée la table qui stocke le catalogue de titres.

create table if not exists tracks (
  id text primary key,
  title text not null,
  genre text not null check (genre in ('synthwave', 'game', 'calm')),
  price numeric not null check (price >= 0),
  download_link text,
  cover_url text,
  audio_url text,
  preview_start numeric not null default 0,
  created_at bigint not null
);

-- Si la table existe déjà (site créé avant l'ajout de ce champ), lance
-- juste cette ligne une fois dans le SQL Editor de Supabase :
-- alter table tracks add column if not exists preview_start numeric not null default 0;

-- La table est lue directement par le serveur avec la clé "service role",
-- qui contourne la sécurité au niveau des lignes (RLS). On peut donc laisser
-- RLS activé par défaut sans ajouter de policy : seul ton serveur (avec sa
-- clé secrète) peut lire/écrire, jamais le navigateur directement.
alter table tracks enable row level security;
