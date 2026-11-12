-- ADKOUL / AUDIT COMPLEMENTAIRE - LECTURE SEULE
-- Exécuter chaque SELECT séparément dans SQL Editor. Ne contient aucune écriture.

-- A. Comptes Auth confirmés et correspondance avec les rôles internes
SELECT a.role::text AS role,
       count(*) AS profils,
       count(u.id) AS comptes_auth,
       count(u.id) FILTER (WHERE u.email_confirmed_at IS NOT NULL) AS comptes_auth_confirmes
FROM public.admins a
LEFT JOIN auth.users u ON lower(trim(u.email))=lower(trim(a.email))
GROUP BY a.role::text ORDER BY 1;

-- B. Colonnes, types et valeurs par défaut utiles pour préparer les autorisations INSERT
SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('admins','demandes','missions','missions_2')
ORDER BY table_name,ordinal_position;

-- C. Politiques existantes complètes
SELECT tablename,policyname,cmd,roles,permissive,qual,with_check
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('admins','demandes','missions','missions_2')
ORDER BY tablename,policyname;

-- D. Vérification RLS et droits directs
SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled,
  has_table_privilege('anon',c.oid,'SELECT') AS anon_select,
  has_table_privilege('anon',c.oid,'INSERT') AS anon_insert,
  has_table_privilege('anon',c.oid,'UPDATE') AS anon_update,
  has_table_privilege('anon',c.oid,'DELETE') AS anon_delete,
  has_table_privilege('authenticated',c.oid,'SELECT') AS user_select
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p')
  AND c.relname IN ('admins','demandes','missions','missions_2')
ORDER BY 1;

-- E. Contraintes des tables, vérification de l'état du modèle
SELECT c.conrelid::regclass::text AS table_name,c.conname AS constraint_name,
       pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
WHERE c.conrelid IN ('public.admins'::regclass,'public.demandes'::regclass,
                     'public.missions'::regclass,'public.missions_2'::regclass)
ORDER BY 1,2;
