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

1. Les pages `apps-familles.html` et `valider-acces-parents-v3.html` sont adaptées dans cette branche pour lire/écrire directement dans Realtime Database, sans callable.
2. `scan-logistique.html` recopie le mouvement confirmé vers le dossier familial lié. La règle exige que l’événement QR soit déjà confirmé dans les mouvements V3.
3. La Direction associe les fiches correspondant au numéro vérifié; le code désactive les fiches déjà liées à un autre compte et offre la suspension.
4. Tester deux comptes parents distincts : chaque compte doit être refusé sur l’UID de l’autre. Tester aussi une demande SMS, l’approbation, les quatre étapes de scan, l’actualisation parent, et la suspension.
5. Comparer les règles proposées avec les règles actives complètes, vérifier les rôles qui doivent conserver l’accès, puis tester avec Firebase Emulator Suite ou Rules Playground. Sauvegarder les règles actuelles avant tout déploiement.

## Limite importante

Ces changements sont isolés sur une branche et ne sont pas publiés. Ils n’ont pas encore été testés sur Firebase Emulator ni avec des comptes réels. Ne déploie pas le fichier de règles seul : vérifie que le schéma et les rôles correspondent aux règles actives et que les trois pages HTML sont publiées ensemble. Le dossier parent ne contiendra que les données recopiées par la Direction et les mouvements synchronisés par le scan.
