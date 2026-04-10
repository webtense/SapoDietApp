import test from "node:test"
import assert from "node:assert/strict"
import { apiError } from "@/lib/server/api"
import { createSessionToken, hashToken, sanitizeText } from "@/lib/server/security-utils"
import { authSchema, setPasswordSchema } from "@/lib/validation"

test("hashToken is deterministic and returns a sha256 hex string", () => {
  const hashA = hashToken("sapofit")
  const hashB = hashToken("sapofit")
  const hashC = hashToken("otro-token")

  assert.equal(hashA, hashB)
  assert.notEqual(hashA, hashC)
  assert.match(hashA, /^[a-f0-9]{64}$/)
})

test("createSessionToken returns a random 64-char hex token", () => {
  const tokenA = createSessionToken()
  const tokenB = createSessionToken()

  assert.match(tokenA, /^[a-f0-9]{64}$/)
  assert.match(tokenB, /^[a-f0-9]{64}$/)
  assert.notEqual(tokenA, tokenB)
})

test("sanitizeText trims input, strips angle brackets and applies max length", () => {
  assert.equal(sanitizeText("  <b>Hola</b>  "), "bHola/b")
  assert.equal(sanitizeText("abcdef", 3), "abc")
})

test("authSchema validates login payload shape", () => {
  assert.equal(authSchema.pick({ email: true, password: true }).safeParse({ email: "user@example.com", password: "12345678" }).success, true)
  assert.equal(authSchema.pick({ email: true, password: true }).safeParse({ email: "bad-email", password: "12345678" }).success, false)
  assert.equal(authSchema.pick({ email: true, password: true }).safeParse({ email: "user@example.com", password: "123" }).success, false)
})

test("setPasswordSchema rejects short passwords and missing token", () => {
  assert.equal(setPasswordSchema.safeParse({ token: "x".repeat(24), password: "12345678", name: "Ana" }).success, true)
  assert.equal(setPasswordSchema.safeParse({ token: "x".repeat(24), password: "123" }).success, false)
  assert.equal(setPasswordSchema.safeParse({ password: "12345678" }).success, false)
})

test("apiError returns a JSON response with the requested status", async () => {
  const response = apiError("No autenticado", 401)

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: "No autenticado" })
})
