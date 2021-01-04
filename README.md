# Audioconf
Des audio conférences pour les agents de l'Etat.

## Générer clé API OVH

Lien : https://eu.api.ovh.com/createToken/

- Nécessaires pour les fonctionalités en cours, pour le nouvel API Rooms

```
POST /telephony/${OVH_ROOM_ACCOUNT_NUMBER}/conference/${OVH_ROOM_PHONE_NUMBER}/rooms
PUT /telephony/${OVH_ROOM_ACCOUNT_NUMBER}/conference/${OVH_ROOM_PHONE_NUMBER}/rooms/*
GET /telephony/${OVH_ROOM_ACCOUNT_NUMBER}/conference/${OVH_ROOM_PHONE_NUMBER}/roomsStats
```

## Détail des appels API OVH utilisés

Les appels que nous faisons à l'API OVH sont les suivants :
- Créer une conférence : `POST /telephony/${OVH_ROOM_ACCOUNT_NUMBER}/conference/${OVH_ROOM_PHONE_NUMBER}/rooms`

L'API retourne le code d'accès de la conférence (roomNumber).
- Configurer la conférence créée : `PUT /telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${config.OVH_ROOM_PHONE_NUMBER}/rooms/${roomNumber}`

On fait ce deuxième appel API pour enlever le PIN qu'on utilise pas et ajouter une date d'expiration à la conférence.
- Obtenir des stats sur les conférences actuellement en cours : `GET /telephony/${config.OVH_ROOM_ACCOUNT_NUMBER}/conference/${config.OVH_ROOM_PHONE_NUMBER}/roomsStats`

On récupère des stats sur les confs actuellement en cours, dont : le nombre de conférences réservées (bookedRoomsCount), le nombre d'appels actuellement en cours (activeConfsCount), le nombre total de participants en ligne dans ces appels (onlineParticipantsCount).

On utilise également cet appel dans la page de stats, pour vérifier que la connection à OVH marche toujours (si cet appel répond bien, on considère qu'on est bien connectés).

- Obtenir la liste des confs passées : `GET /telephony/${OVH_ROOM_ACCOUNT_NUMBER}/conference/${OVH_ROOM_PHONE_NUMBER}/rooms` (pour l'ancien API numbers)

- Obtenir l'historique d'une conf passée donnée : `GET /telephony/{process.env.OVH_ROOM_ACCOUNT_NUMBER}/conference/{OVH_ROOM_PHONE_NUMBER}/rooms/{roomNumber}/histories` (pour l'ancien API numbers)


### Créer des migrations

[KnexJS](http://knexjs.org/#Migrations) permet de créer des migrations de base de données. Un shortcut a été ajouté au `package.json` pour créer une migration :

```
npm run makeMigration <nom de la migration>
```

Une fois la migration créée, vous pouvez l'appliquer avec :

```
npm run migrate
```

Pour utiliser d'autres commandes, le [CLI de KnexJS](http://knexjs.org/#Migrations) est disponible avec `./node_modules/knex/bin/cli.js`. Par exemple, pour faire un rollback :

```
./node_modules/knex/bin/cli.js migrate:rollback
```

## Développement

L'environnement de développement est préconfiguré pour Visual Code.
Pour profiter de l'intégration avec ESLint, il faut installer le plugin du même nom.

## Docker compose

- Récupérer les dépendences : `docker-compose run -u root web npm install`
- Créer les tables de la DB : `docker-compose run web npm run migrate`
- Créer une migration : `docker-compose run web npm run makeMigration <nom de la migration>`
- Lancer le service : `docker-compose up` ou `docker-compose run -p 8080:8080 web npm run dev`

## Test de charge Locust

- `cd locust`
- `docker-compose up --scale worker=8` (8 c'est pour 8 CPU)
- Ouvrir http://localhost:8089/

## Tester que le HTML d'un site est valide

```
npm run checkHTML --  <url du site à tester>
```

Si on veut checker pour une PR donnée, utiliser l'url de la review app de la PR (voir les checks dans la PR).

Pour valider le code en local :

```
npm run checkHTMLLocal
```

## Sticky sessions

Le système de session est `in memory`. Dans un environnement à plusieurs containers web, cela peut poser des problèmes.
Comme la production est dans ce cas, il faut activer les sticky sessions.
Bien vérifier donc qu'ils sont activés (dans Scalingo > Settings).

## SQL

- Total de réservation par nom de domaine : `select substring(email from '@[^@]*$') as domain, count(*) from conferences group by domain order by count DESC;`
- Nombre de réservations par durée de réservation : `SELECT "durationInMinutes" , count(*) as count from conferences GROUP BY "durationInMinutes" ORDER BY count DESC;`
- Nombre de réservations annulées : `SELECT "canceledAt" IS NOT NULL as canceled, count(*) from conferences GROUP BY canceled;`
