# Audioconf
Des audio conférences pour les agents de l'Etat.

## Générer clé API OVH

Lien : https://eu.api.ovh.com/createToken/

- Nécessaires pour les fonctionalités en cours, pour l'API des numéros de téléphone

```
GET /telephony/${OVH_ACCOUNT_NUMBER}/conference
PUT /telephony/${OVH_ACCOUNT_NUMBER}/conference/*/settings
GET /telephony/${OVH_ACCOUNT_NUMBER}/conference/*/participants
POST /telephony/${OVH_ACCOUNT_NUMBER}/conference/*/participants/*/kick
GET /telephony/${OVH_ACCOUNT_NUMBER}/conference/*/informations
```

- Nécessaires pour les fonctionalités en cours, pour le nouvel API Rooms

```
POST /telephony/${OVH_ROOM_ACCOUNT_NUMBER}/conference/${OVH_ROOM_PHONE_NUMBER}/rooms
PUT /telephony/${OVH_ROOM_ACCOUNT_NUMBER}/conference/${OVH_ROOM_PHONE_NUMBER}/rooms/*
GET /telephony/${OVH_ROOM_ACCOUNT_NUMBER}/conference/${OVH_ROOM_PHONE_NUMBER}/roomsStats
```

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
Pour profiter de l'intégration avec ESLint et Prettier, installer les plugins du même nom.

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

## SQL

- Total de réservation par nom de domaine : `select substring(email from '@[^@]*$') as domain, count(*) from conferences group by domain order by count DESC;`
- Nombre de réservations par durée de réservation : `SELECT "durationInMinutes" , count(*) as count from conferences GROUP BY "durationInMinutes" ORDER BY count DESC;`
- Nombre de réservations annulées : `SELECT "canceledAt" IS NOT NULL as canceled, count(*) from conferences GROUP BY canceled;`
