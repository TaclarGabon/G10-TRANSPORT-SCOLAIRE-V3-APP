# G10 Transport Scolaire — Façade Martina avec données V2

## Décision métier
Martina souhaite **réorganiser l'interface** (dont l'onglet Abonnement, les tableaux, les sections et la version QR bleu clair), **pas migrer de base**. L'état V2 reste la seule source de vérité :
`g10TransportScolaireV2/demoState/state`.

Cette branche est une **prévisualisation de la livraison A**, non une mise en production.

## Travail réalisé sur cette branche
- `administration-validation.html` conserve la façade et les 11 onglets déjà validés.
- Ses anciens scripts de liaison `v3-client.js`, `v3-admin-ui.js` et `v3-bilan-final.js` sont remplacés **uniquement dans cette branche** par des composants en lecture seule.
- `firebase/v2-readonly-adapter.js` : authentification Firebase, contrôle du rôle direction/admin actif, **lecture unique** du chemin V2, extraction d'indicateurs prudents.
- `firebase/v2-preview-ui.js` : connexion interactive sur la page HTTPS, affichage des tableaux V2 en mémoire uniquement après autorisation. Les boutons d'action de la démonstration ne sont pas activés.
- `tests/v2-readonly-adapter.test.cjs` : tests synthétiques des valeurs manquantes, montants ambigus, non-mutation et autorisation.

**Aucune écriture, suppression, modification de règles ou migration Firebase** dans les fichiers ajoutés. Aucun secret, export réel, jeton ou dossier d'enfant n'a été ajouté.

## Correspondances affichées (à faire valider sur les données réelles)

| Onglet V3 | Lecture source V2 | Disponibilité dans la prévisualisation |
| --- | --- | --- |
| Abonnés | `subs` | Nom, école, classe, responsable, contact, adresse, bus en lecture seule |
| Abonnement | `subs`, `paymentV147` | Formule, tarif, réduction, statut, référence QR si renseignés |
| Paiements | `subs[*].amountReceived` et `subs[*].paymentV147` | Affichage **par fiche** seulement ; **aucune transaction reconstruite** |
| Circuit | `subs`, présence de `schoolOrdersV160` et `morningRouteOrder` | Rapprochement préliminaire ; ordre opérationnel pas encore validé |
| Rapports | `subs`, `vehicleExpenses` | Totaux seulement si montants interprétables ; ne pas assimiler aux montants comptables certifiés |
| Chauffeurs | `drivers`, signal `driver` | Liste si format reconnu |
| Staff | `staff` | Liste si format reconnu |
| Dépenses | `vehicleExpenses` | Type, montant, date, facture, présence justificatif ; **pas encore ouverture de photos** |
| QR | `subs[*].qrRef`, présence `qrJourneys` | Références en lecture ; **pas de génération/scan en production** |
| Astuce intelligente | indicateurs V2 | Aucune décision métier automatique |
| Avis & réclamations | `locationFeedback` signalé | Modèle à confirmer, rien inventé |

La V2 historique utilise notamment `g10-payments-v147.js` et `g10-qr-school-v146.js` sur son dépôt. Il faut **réemployer leurs fonctions métier sans déclencher de sauvegarde** lors de la phase A. Le module QR V2 contient des opérations susceptibles de modifier les fiches (attribution automatique de QR) : il ne faut donc pas l'appeler directement dans la prévisualisation.

## Sécurité
- Accès aux données après Firebase Authentication et contrôle du rôle actif sous `g10TransportScolaireV3/roles/{uid}`.
- Les règles V2 autorisent encore toute écriture à `auth != null` ; l'absence d'appels d'écriture dans ces nouveaux modules est volontaire mais **n'est pas une barrière serveur**.
- Aucun rapport réel ou donnée familiale dans ce dépôt GitHub public.
- Les scripts précédemment installés en `main` restent en place et ne sont **pas** modifiés par la branche.
- **Attention confidentialité préexistante :** la maquette `administration-validation.html` inclut des références QR et certains noms historiques codés en dur dans son code source public. Faire examiner et supprimer/anonymiser ces données avant toute future mise en service publique.

## Validation obligatoire avant tout déploiement
1. Exécuter `node --test tests/v2-readonly-adapter.test.cjs` et contrôler les scripts par `node --check`.
2. Revue manuelle du diff et inspection sécurité avant exposition sur une adresse HTTPS de confiance.
3. Test de connexion réalisé par un compte autorisé, **sans confier de mot de passe ni d'export au chat ou à GitHub**.
4. Comparaison **réelle** : nombre d'abonnés, encaissements des fiches, dépenses, chauffeurs, QR et pièces justificatives.
5. Vérification du rendu exact de la façade validée par Martina (onglets, colonnes, badge QR bleu clair), avec captures non sensibles.
6. Livraison B : brancher les opérations existantes V2 **à partir de son schéma réel et de ses sauvegardes**, avec tests métier et validation expresse avant écriture.
7. Préparer une sauvegarde privée et une procédure de retour arrière pour la bascule de l'interface. Ne pas changer l'URL de production sans validation de Martina.

## Décisions encore nécessaires
- Accès aux données V2 en situation réelle pour les tests visuels et de cohérence.
- Confirmation du comportement attendu de chaque bouton de modification, des justificatifs et des QR.
- Validation humaine de la livraison A puis de la B, avant toute mise en production.

L'ancienne V2 est inchangée. Cette branche est une proposition de code **à examiner**, pas un déploiement.
