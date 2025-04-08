## Project setup

```bash
yarn install
```

## To run local

1. Create .env file in root

2. run docker with db

```bash
docker-compose -f dev-docker-compose.yml up --build -d
```

3. do migration

```bash
npx prisma migrate deploy
```

## Prisma

dev migration

```bash
npx prisma migrate dev --name init
```

production migration

```bash
npx prisma migrate deploy
```

update prisma schema

```bash
npx prisma generate
```
