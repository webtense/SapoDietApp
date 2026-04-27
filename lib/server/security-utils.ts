import { createHash, randomBytes } from "crypto"

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function createSessionToken() {
  return randomBytes(32).toString("hex")
}

export function sanitizeText(value: string, maxLength = 255) {
  return value.replace(/[<>]/g, "").trim().slice(0, maxLength)
}
