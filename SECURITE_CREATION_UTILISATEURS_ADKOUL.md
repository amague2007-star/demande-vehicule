# ADKOUL — Réparation sécurisée de la création d'utilisateurs (préparation)

## Constat en production (lecture seule, 16 novembre 2026)

- 5 comptes dans public.admins ; 1 utilisateur Supabase Auth avec adresse correspondante et email confirmé, de rôle logistique.
- RLS activée sur public.admins ; aucune politique INSERT pour le formulaire actuel, d'où 42501 / HTTP 401.
- SELECT public sur admins expose notamment password_hash; DELETE public sur admins est permis.
- L'authentification historique compare un SHA-256 dans le navigateur. Des droits en sessionStorage ne permettent pas d'autoriser des opérations sensibles.

## Ce correctif

- Ne modifie **que** admin.html et ajoute un brouillon de fonction Edge + fichier de configuration ; ne change aucune politique RLS.
- La création d'un utilisateur demande une **vérification Supabase Auth supplémentaire** du compte Logistique. Les quatre autres comptes historiques continuent d'utiliser leur connexion actuelle, mais ne pourront pas créer de comptes tant que leur Auth n'est pas provisionné.
- L'Edge Function vérifie le JWT Supabase Auth, l'email confirmé et le rôle logistique stocké côté serveur. Elle crée l'utilisateur dans Supabase Auth puis la ligne correspondante dans admins.
- La création reste en compatibilité avec le mécanisme historique SHA-256. **Ce n'est pas encore une migration complète de l'authentification.** Les faiblesses de lecture publique / suppression publique doivent être corrigées séparément.
- Mot de passe minimum 12 caractères. Il n'est pas envoyé dans l'email de bienvenue. Le mot de passe administrateur Supabase Auth n'est pas stocké par l'interface.

## Ordre de déploiement (à ne pas inverser)

1. Faire une sauvegarde de l'état GitHub, des 5 comptes et des politiques RLS, **sans publier les empreintes ou mots de passe**.
2. Vérifier que le compte Logistique actuel dispose du mot de passe de sa **session Supabase Auth** (qui peut être différent du mot de passe historique). Aucun secret ne doit être envoyé dans ChatGPT.
3. Déployer uniquement la fonction secure-admin-users avec verify_jwt=true et les secrets automatiques SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. L'Origin autorisée est https://amague2007-star.github.io.
4. Tester la fonction avec une session Auth vérifiée, une identité non habilitée et un jeton absent : les deux derniers doivent être refusés. Ne créer un nouveau compte que pour un agent habilité à la création.
5. **Seulement après vérification**, fusionner la PR admin.html pour activer le nouveau bouton.
6. Vérifier les nouveaux comptes et les emails sans toucher aux missions ou demandes existantes.

## Correction structurelle encore nécessaire

- Migrer les 4 comptes historiques restants vers Supabase Auth, puis basculer TOUTE la connexion admin et les accès aux tables vers les JWT Supabase Auth.
- Supprimer l'accès public SELECT (et ainsi toute exposition de password_hash) et les politiques dangereuses DELETE sur admins; retirer également les droits publics non souhaités sur demandes et protéger missions_2 par RLS.
- Utiliser des contrôles d'autorisations côté serveur et du RLS sur chaque opération CRUD. Ne **jamais** ajouter une politique INSERT TO anon WITH CHECK (true) à admins.
- Une fois tous les comptes migrés et les usages vérifiés, retirer le champ password_hash de l'application, puis de la base dans une migration séparée.

## Limites / tests

Vérification syntaxique JavaScript réalisée, mais **aucun déploiement Edge, test d'authentification réel ni écriture en base** n'a été fait au stade de cette préparation.
