# Pilote G10 Parents — Spark (sans Cloud Functions)

Statut : branche isolée, aucune modification de V2, de Martina, des règles Firebase ni du déploiement public.

## Architecture retenue
- Une identité Firebase Authentication propre à chaque parent (e-mail/mot de passe pour le pilote, sans SMS payant).
- Un espace de lecture familial dans Realtime Database, distinct des anciens chemins : `g10ParentsSparkPilot/families/{uid}/days/{date}`.
- Le parent ne doit voir que ses enfants, pas les dossiers d'autres familles.
- L'interface Parents ne doit jamais écrire dans l'administration ni lire directement les données sensibles de V2.
- L'alimentation de l'espace familial devra être réalisée par un processus Direction autorisé ; aucune donnée réelle ne doit être dupliquée avant validation des droits.

## Règles de principe, non installées
Sous `g10ParentsSparkPilot/families/$uid`, autoriser `.read` uniquement si `auth != null && auth.uid === $uid`, et refuser toute écriture côté Parents. La présence de permissions accordées plus haut dans l'arbre Realtime Database doit être évaluée : une règle enfant ne révoque pas une règle parent permissive.

Ne jamais publier ce fragment isolément : publier des règles Firebase remplace les règles existantes. Tester d'abord le fichier de règles COMPLET dans l'émulateur Firebase.

## Tests bloquants avant diffusion
1. Anonyme : accès interdit.
2. Parent A : peut lire A, ne peut pas lire B.
3. Parent B : peut lire B, ne peut pas lire A.
4. Parent A : ne peut rien écrire.
5. Martina et V2 : lecture/écriture inchangées.
6. Aucun accès à un chemin parent large ni aux mouvements des autres enfants.
7. La mise à jour des événements scan vers le miroir parent est démontrée, sans fuite d'informations.

## Conclusion
Le code de l'interface et la configuration Firebase restent à finaliser ; cette branche n'autorise aucune mise en production sans les tests d'isolation ci-dessus.
