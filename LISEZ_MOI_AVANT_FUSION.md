# ADKOUL — Tableau de bord et sécurité (préparation, non déployée)

## Modifications proposées
- admin.html : authentification Supabase Auth conservée, rôles existants reconnus ;
  liste en lecture seule des demandes de véhicules, missions terrain et ordres de mission ;
  recherche locale, compteurs, accès par rôle et déconnexion.
- impression-ordre.html : rôle RH ou directeur logistique requis côté interface.
- AUDIT_RLS_AVANT_APPLICATION.sql : requêtes de diagnostic non destructives.
- PROPOSITION_RLS_BLOQUEE_NE_PAS_EXECUTER.sql : ébauche RLS avec exception volontaire
  en tête : NE PAS EXÉCUTER NI RETIRER LE VERROU EN PRODUCTION.

## Contrôles de sécurité indispensables
La connexion navigateur ne remplace PAS les politiques serveur. Les données de
production sont actuellement exposées par des permissions excessives signalées
dans les audits. La PR ne doit pas être fusionnée tant que RLS n'est pas corrigé,
sauvegardé et testé. Les anciennes politiques permissives doivent être supprimées
pour que les nouvelles politiques aient l'effet prévu.

La table admins peut contenir d'anciens hashes de mot de passe :
interdire absolument leur SELECT via l'API. Le script propose un GRANT SELECT de
colonnes uniquement (nom, email, role) et une fonction à privilège élevé vérifiant
un utilisateur Auth avec e-mail confirmé. Vérifier la sécurité des fonctions
SECURITY DEFINER, les propriétaires, les privilèges existants, les triggers et les
permissions sur séquences.

Les GRANT INSERT sur colonnes supposent que les champs des formulaires
correspondent au schéma Supabase réel : vérifier AUDIT_RLS_AVANT_APPLICATION.sql
et tester la création d'une demande avant toute migration. Le rôle
assistant_logistique ne lit pas missions_2 dans cette proposition. Adapter selon
les décisions métier validées.

## Essais indispensables
- navigation non authentifiée : jamais de lecture RH/admin ;
- connexion valide de chaque rôle ;
- utilisateur Auth sans profil : aucun accès aux demandes ;
- lecture de ses seuls profils sur admins (aucun password_hash) ;
- test de soumission des 3 formulaires par un visiteur ;
- absence de lecture/UPDATE/DELETE pour anon ;
- test d'impression avec les rôles RH/directeur et rejet des autres ;
- tests de cache du service worker, validation de l'interface mobile.

## Limitations
Ce tableau de bord est une version de consultation, sans affectation/validation.
Le chargement affiche au maximum 100 demandes par table. Les politiques RLS
sont indispensables pour sécuriser réellement les données. Aucun changement de
la base Supabase n'a été réalisé, aucune sauvegarde vérifiée ici et aucune
validation end-to-end ne peut être revendiquée.
