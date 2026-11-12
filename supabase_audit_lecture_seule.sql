-- Audit non destructif : aucune insertion, mise à jour ni suppression.
SELECT n.nspname AS schema_name,c.relname AS table_name,c.relrowsecurity AS rls_enabled
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p')
AND c.relname IN ('admins','demandes','missions','missions_2')
ORDER BY c.relname;

SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('admins','demandes','missions','missions_2')
ORDER BY tablename,policyname;

SELECT table_name,column_name,data_type,is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('admins','demandes','missions','missions_2')
ORDER BY table_name,ordinal_position;

SELECT table_name,grantee,privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name IN ('admins','demandes','missions','missions_2')
AND grantee IN ('anon','authenticated','PUBLIC')
ORDER BY table_name,grantee,privilege_type;
