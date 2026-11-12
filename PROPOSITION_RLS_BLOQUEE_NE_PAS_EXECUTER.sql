-- PROPOSITION ADKOUL / NE PAS EXECUTER EN PRODUCTION
-- Schéma proposé, NON VALIDE PAR TESTS. Ne supprime aucune donnée.
-- Cette version contient volontairement un verrou qui rend son exécution impossible.
-- Conditions avant toute future application : sauvegarde restaurable, audit du schéma
-- et des politiques, validation des rôles, test sur environnement non productif.
BEGIN;
DO $$
BEGIN
  RAISE EXCEPTION 'ADKOUL : SCRIPT BLOQUE. Non validé pour la production.';
END $$;

-- REFERENCE TECHNIQUE SEULEMENT : ne pas débloquer sans nouvelle validation.
-- Retirer tous les accès anonymes de lecture, modification, suppression.
-- Réintroduire UNIQUEMENT les colonnes d'insertion publiques requises.
REVOKE ALL ON TABLE public.admins,public.demandes,public.missions,public.missions_2
FROM PUBLIC,anon,authenticated;

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions_2 ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques permissives existantes après audit exhaustif.
DO $$
DECLARE p RECORD;
BEGIN
 FOR p IN
   SELECT schemaname,tablename,policyname FROM pg_policies
   WHERE schemaname='public' AND tablename IN ('admins','demandes','missions','missions_2')
 LOOP
   EXECUTE format('DROP POLICY %I ON %I.%I',p.policyname,p.schemaname,p.tablename);
 END LOOP;
END $$;

-- Le rôle est résolu sur le serveur depuis un compte Auth dont l'e-mail est confirmé.
-- Fonction SECURITY DEFINER : protéger son propriétaire et son search_path.
CREATE OR REPLACE FUNCTION public.adkoul_role_auth()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
 SELECT lower(trim(a.role::text))
 FROM public.admins a
 JOIN auth.users u ON lower(trim(u.email))=lower(trim(a.email))
 WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL
 LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.adkoul_role_auth() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.adkoul_role_auth() TO authenticated;

-- Profil : l'utilisateur authentifié peut lire seulement le sien ;
-- l'exposition des colonnes est restreinte par GRANT SELECT(...).
GRANT SELECT(email,nom,role) ON public.admins TO authenticated;
CREATE POLICY adkoul_admins_self_read ON public.admins
FOR SELECT TO authenticated
USING (
  public.adkoul_role_auth() IS NOT NULL
  AND lower(trim(email))=lower(trim(auth.jwt()->>'email'))
);

-- Lecture selon les responsabilités approuvées.
GRANT SELECT ON public.demandes,public.missions,public.missions_2 TO authenticated;
CREATE POLICY adkoul_demandes_staff_read ON public.demandes
FOR SELECT TO authenticated
USING (public.adkoul_role_auth() IN ('logistique','assistant_logistique','directeur_logistique'));

CREATE POLICY adkoul_missions_staff_read ON public.missions
FOR SELECT TO authenticated
USING (public.adkoul_role_auth() IN ('logistique','assistant_logistique','directeur_logistique','rh'));

CREATE POLICY adkoul_ordres_staff_read ON public.missions_2
FOR SELECT TO authenticated
USING (public.adkoul_role_auth() IN ('logistique','directeur_logistique','rh'));

-- Formulaires publics : droits uniquement sur les champs saisis dans l'application.
-- Verifier la structure actuelle, les colonnes GENERATED/DEFAULT et les séquences !
GRANT INSERT (
  nom,prenom,poste,service,email,contact,date_sortie,heure_depart,
  duree,destination,passagers,responsable,motif,statut
) ON public.demandes TO anon;

GRANT INSERT (
  nom,fonction,telephone,email,titre_mission,lieu,type_mission,
  date_debut,date_fin,itineraire,participants,description,statut
) ON public.missions TO anon;

GRANT INSERT (
  projet,nom,poste,bureau,email,accompagnateurs,destination,objectif,
  date_depart,date_retour,moyen_deplacement,imputation_budgetaire,statut
) ON public.missions_2 TO anon;

CREATE POLICY adkoul_demandes_public_insert ON public.demandes
FOR INSERT TO anon WITH CHECK (statut::text='en_attente');
CREATE POLICY adkoul_missions_public_insert ON public.missions
FOR INSERT TO anon WITH CHECK (statut::text='en_attente');
CREATE POLICY adkoul_ordres_public_insert ON public.missions_2
FOR INSERT TO anon WITH CHECK (statut::text='en_attente');

-- Aucun droit UPDATE/DELETE pour anon/authenticated à ce stade.
COMMIT;
