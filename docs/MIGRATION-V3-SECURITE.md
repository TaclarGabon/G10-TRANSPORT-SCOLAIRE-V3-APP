# G10 V3 — Préparation et simulation sécurisée

Cette livraison répond à l’issue #1. La branche locale `work` et `origin/main`
étaient au même commit `0d17a5ebb4df458ecfce409dddfd7bba76bc57b0` après fetch.
Les trois fichiers annoncés étaient absents des deux branches et de l’espace de
travail ; ils sont préparés ici, sans prétendre restaurer un travail antérieur.

## Périmètre de la revue

- `migration-v3-simulation.html` : exemple synthétique, sans formulaire de connexion.
- `firebase/v3-migration-plan.js` : fonction pure recevant deux objets en mémoire.
- `firebase/v3-simulation-ui.js` : affichage textuel du rapport agrégé.
- `tests/v3-migration-plan.test.cjs` : vérifications hors ligne et données fictives.

Aucun lien n’est ajouté à l’application existante, aucun fichier de production
n’est modifié, aucun workflow de déploiement n’est ajouté. La branche doit rester
non fusionnée avant revue. Ne pas publier cette page sur GitHub Pages. Une fusion
sur une branche servie directement par Pages pourrait la publier : vérifier la
configuration d’hébergement avant toute fusion, avec autorisation distincte.

## Garanties et limites

Le nouveau code n’importe aucun SDK Firebase et ne dispose d’aucun adaptateur
réseau, stockage persistant, export ou méthode d’écriture. La page interdit les
connexions et formulaires par CSP. Elle ne charge pas `v3-client.js`,
`v3-admin-ui.js` ni les contrôles d’écriture existants.

Les chemins `g10TransportScolaireV2` et `g10TransportScolaireV3/data` et les règles
Firebase ne sont jamais modifiés. Les 33 abonnés existants ne sont ni lus par cette
page, ni inclus dans le plan. Aucune reprise QR vers `movements` n’est prévue.

Seuls les nœuds canoniques `expenses`, `circuits`, `payments` sont examinés.
Les sources alternatives, dont `vehicleExpenses`, `events` et `gestionJournalV148`,
ne sont jamais converties implicitement. Leur présence est signalée. Une source
canonique absente ou une cible non fournie n’est pas assimilée à une liste vide.
Les cibles doivent être des dictionnaires avec `id` égal à leur clé.

Le contrat synthétique exige un identifiant explicite, un montant entier positif
pour dépenses/paiements, et un nom non vide pour circuits. Ce contrat n’est pas
une validation du schéma V2 réel. Les totaux, dates, devises, liens avec abonnés,
annulations, remboursements et équivalences métier restent à définir et valider.
Les identifiants déjà présents (y compris `sourceId`/`legacyId`) sont exclus des
candidats, et les doublons source sont signalés. Un rapprochement d’identifiants
n’établit pas l’égalité métier des dossiers ; `existing` signifie uniquement
« identité repérée en cible » et ne certifie pas leur contenu.

Tous les rapports restent bloqués (`executionAllowed: false`, `blocked: true`),
même sans anomalie. Ils ne contiennent ni enregistrement, ni identifiant, ni nom,
ni montant réel : seulement des compteurs et motifs fixes. Aucun payload de
migration exécutable n’est produit. Les entrées ne sont pas modifiées.

## Confidentialité avant commit

Examiner uniquement les nouveaux fichiers et le diff complet à committer : aucun
mot de passe, jeton, clé privée, identifiant de connexion, export de base, donnée
personnelle ou rapport réel ne doit entrer dans le dépôt public. Ne jamais joindre
de capture de session, fichier `.env`, état navigateur ou résultat Firebase réel.
Les exemples et tests de cette livraison sont entièrement synthétiques.

## Vérification locale

Depuis la racine du dépôt :

```sh
node --test tests/v3-migration-plan.test.cjs
node --check firebase/v3-migration-plan.js
node --check firebase/v3-simulation-ui.js
git diff --check
```

Pour une revue manuelle locale uniquement, servir le checkout avec un serveur
statique et ouvrir `migration-v3-simulation.html`. Aucun test Firebase navigateur
déjà validé n’a besoin d’être refait. L’authentification Firebase réelle n’a pas
été vérifiée en session Codex ; les tests de cette livraison sont synthétiques.
La revue visuelle navigateur reste distincte des tests automatiques Node.

## Avant une future reprise réelle

Prévoir une session authentifiée via un mécanisme sécurisé hors chat/GitHub et une
lecture autorisée de la V2 ainsi que des trois modules V3. Ne jamais exporter les
données dans ce dépôt. Valider séparément chaque mapping et le rapprochement
métier, en particulier la nature des paiements. Préparer les sauvegardes dans un
espace privé autorisé. Toute écriture, modification de règles ou publication
nécessite une validation explicite distincte ; cette PR n’en autorise aucune.
