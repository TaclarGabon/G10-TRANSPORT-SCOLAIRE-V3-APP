# Proposition d’accès Parents sans Cloud Functions

**État : brouillon non publié.** Ce fichier n’est pas prêt à être copié dans Firebase. Il sert à cadrer les règles et les adaptations nécessaires.

## Ce que cette proposition corrige

- Les branches `g10TransportScolaireV2`, `v3EncryptedDrafts` et `v3SharedWorkspace` n’accordent l’accès qu’aux comptes activés ayant un rôle interne explicite (`direction`, `admin`, `exploitation`). Un compte sans rôle est refusé.
- `g10TransportScolaireV3/parentRequests/{uid}` permet à un parent connecté par téléphone de déposer une demande sous son propre UID, avec le même numéro vérifié par Firebase Auth. La Direction peut consulter et traiter les demandes.
- `g10TransportScolaireV3/parentPortal/{uid}` permet au parent de lire son seul dossier si celui-ci est activé. Seule la Direction peut publier ou désactiver un dossier.

## Données à publier dans chaque dossier

La projection doit contenir uniquement les enfants de cette famille et les informations destinées au parent : nom, école/classe et mouvements. Exemple :

```json
{
  "enabled": true,
  "updatedAt": 1795000000000,
  "children": {
    "ID_ELEVE": {
      "name": "Nom de l’élève",
      "school": "École",
      "className": "Classe",
      "movements": {
        "boardingAM": { "timeMs": 1795000000000, "validatedBy": "Contrôleuse" }
      }
    }
  }
}
```

## Adaptations obligatoires avant publication

1. Remplacer dans `apps-familles.html` l’appel Cloud Function `getG10MyTransportV2` par une lecture de `parentPortal/{uid}`, et afficher l’état « demande en attente » tant que le dossier n’est pas activé.
2. Remplacer dans `valider-acces-parents-v3.html` les appels Cloud Functions par une interface Direction qui lit les demandes, associe le numéro vérifié aux fiches d’abonnés, permet de choisir les enfants, puis publie la projection.
3. Adapter le scan logistique pour recopier chaque nouveau mouvement dans le dossier parent correspondant. Sans cette étape, les mouvements des parents ne seront pas actualisés automatiquement.
4. Ajouter une procédure de révocation et tester deux comptes parents distincts : chaque compte doit être refusé sur l’UID de l’autre.
5. Tester les règles avec Firebase Emulator Suite ou Rules Playground, puis faire une sauvegarde des règles avant tout déploiement.

## Limite importante

Ce brouillon de règles ne suffit pas à rendre l’application Parents opérationnelle. Le code public actuel dépend de trois fonctions serveur pour lire les familles et approuver/révoquer les accès; aucune source de ces fonctions n’est présente dans le dépôt. Les règles ci-jointes ferment l’accès trop large mais ne doivent pas être publiées seules : cela pourrait bloquer les écrans existants sans fournir le parcours Parents sans Functions.
