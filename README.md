# conferences
Des audio (et video?) conférences pour les fonctionnaires de l'Etat.


## Générer clé API OVH

Lien : https://eu.api.ovh.com/createToken/

- Nécessaires pour les fonctionalités en cours
```
GET /telephony/*
POST /telephony/*
DELETE /telephony/*
PUT /telephony/*
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

## Docker compose

- Récupérer les dépendences : `docker-compose run -u root web npm install`
- Créer les tables : `docker-compose run web npm run migrate`
- Créer une migration : `docker-compose run web npm run makeMigration <nom de la migration>`
- Lancer le service : `docker-compose up` ou `docker-compose run -p 8080:8080 web npm run dev`

## Test de charge Locust

- `cd locust`
- `docker-compose up --scale worker=8` (8 c'est pour 8 CPU)
- Ouvrir http://localhost:8089/
