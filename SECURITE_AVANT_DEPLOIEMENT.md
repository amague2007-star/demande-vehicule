# Sécurisation ADKOUL — Branche de préparation

## Avant toute mise en production
La connexion admin utilise maintenant Supabase Auth. Les comptes de la table `admins` ne constituent **pas** à eux seuls des comptes Supabase Auth : créer ou inviter les utilisateurs autorisés dans Supabase Authentication, avec adresse e-mail identique. Réinitialiser sans délai l'ancien mot de passe prérempli qui figurait dans `admin.html`.

Exécuter le fichier `supabase_audit_lecture_seule.sql` dans Supabase SQL Editor. **Aucune modification Supabase n'est incluse.** Vérifier et corriger les politiques RLS par une opération distincte et approuvée avant de déployer. Les contrôles de rôle Javascript ne remplacent **pas** une autorisation côté serveur.

Politiques à examiner :
- `admins` : lecture uniquement du profil adéquat ou via une fonction de vérification sécurisée ; aucune modification de rôle par un utilisateur ordinaire ; aucune lecture anonyme.
- `missions_2` : aucun SELECT/UPDATE/DELETE anonyme, sauf exceptions métier explicitement approuvées ; accès RH/admin contrôlé en base.
- `missions` et `demandes` : inserts publics seulement si le parcours doit rester public, avec colonnes et valeurs limitées ; toutes les consultations réservées aux rôles autorisés.
- Empêcher qu'une politique permissive déjà en place contredise les nouvelles restrictions ; examiner toutes les policies en vigueur.

## Vérifications conseillées
Tester anonyme, compte non autorisé, RH, admin, déconnexion, expiration de session, et accès direct à la page d'impression. Confirmer que les formulaires enregistrent toujours les demandes et que les courriels sont envoyés ou signalés comme non confirmés. Tester l'installation PWA Android et iOS ; `logo.webp` fait 474 × 474 px et sa compatibilité native varie selon les plateformes. Des PNG 192 et 512 px restent recommandés pour une meilleure compatibilité.

## Limites de la préparation
Cette branche n'a pas été fusionnée ni déployée. Les règles RLS, les comptes Auth, les paramètres EmailJS et les données Supabase n'ont pas été consultés ou modifiés. La page d'impression repose sur le contrôle d'accès de la table `admins` et de `missions_2` : elle restera volontairement inaccessible tant que les règles Supabase ne permettent pas une authentification autorisée.
