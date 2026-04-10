# Despliegue

## Local

1. Copiar variables:

```bash
cp .env.example .env
```

2. Instalar dependencias:

```bash
npm install
```

3. Inicializar DB:

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

4. Ejecutar app:

```bash
npm run dev
```

## EasyPanel (paso posterior)

- Configurar servicio Node con build `npm run build` y start `npm run start`.
- Definir variables de entorno (`DATABASE_URL`, `SESSION_COOKIE_NAME`, `SESSION_DAYS`, `CRON_SECRET`).
- En servidor recomendado usar Postgres para concurrencia y backups.
- Si se mantiene SQLite, montar volumen persistente para `prisma/dev.db`.

## Checklist previo a subir

- `npm run build` sin errores.
- Sin secretos en commits.
- Credenciales rotadas.
- Backup de base de datos.
