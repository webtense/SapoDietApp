CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "method" VARCHAR(10) NOT NULL,          -- POST, PATCH, PUT, DELETE
  "path" TEXT NOT NULL,                   -- /api/admin/users, /api/admin/newsletter/send, etc
  "status" INTEGER NOT NULL,              -- HTTP status (200, 400, 401, etc)
  "details" JSONB,                        -- datos adicionales (qué se cambió, IDs afectados, etc)
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AdminAuditLog_userId_createdAt_idx" ON "AdminAuditLog"("userId", "createdAt" DESC);
CREATE INDEX "AdminAuditLog_path_createdAt_idx" ON "AdminAuditLog"("path", "createdAt" DESC);
