Tests escritos para vitest (usan `vi.mock`). vitest no está instalado y `npm test`
usa el runner de Node (`node --test tests/*.test.ts`), así que NO se ejecutan.
Pendiente: añadir vitest + alias `@/` o portarlos a `node:test`.
