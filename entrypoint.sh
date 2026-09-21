#!/bin/sh
set -e

npx prisma migrate deploy

# Con output: "standalone" en next.config.mjs, "next start" ya no funciona.
# Hay que ejecutar el servidor standalone generado por el build.
node server.js
