import { randomBytes, scryptSync } from "crypto"

/** Deterministic enough for auto-generated guest passwords; avoids native bcrypt dependency. */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(plain, salt, 64)
  return `${salt.toString("hex")}:${hash.toString("hex")}`
}
