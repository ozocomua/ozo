import fs from "node:fs"
import path from "node:path"

const LOG_DIR = path.join(process.cwd(), "logs")
const LOG_FILE = path.join(LOG_DIR, "error.log")

const isDev = process.env.NODE_ENV !== "production"

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

function formatTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const y = now.getFullYear()
  const mo = pad(now.getMonth() + 1)
  const d = pad(now.getDate())
  const h = pad(now.getHours())
  const mi = pad(now.getMinutes())
  const s = pad(now.getSeconds())
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`
}

function serializeContext(context: unknown): string {
  if (context === undefined || context === null) return ""
  if (typeof context === "string") return context
  try {
    return JSON.stringify(context)
  } catch {
    return String(context)
  }
}

function writeToFile(level: string, message: string, context: unknown): void {
  try {
    ensureLogDir()
    const ts = formatTimestamp()
    const ctx = serializeContext(context)
    const line = ctx
      ? `[${ts}] ${level} | ${message} | ${ctx}\n`
      : `[${ts}] ${level} | ${message}\n`
    fs.appendFileSync(LOG_FILE, line, "utf-8")
  } catch {
    // Cannot log about logging failures -- silently ignore
  }
}

export const logger = {
  error(message: string, context?: unknown): void {
    console.error(`[${formatTimestamp()}] ERROR | ${message}`, context ?? "")
    writeToFile("ERROR", message, context)
  },

  warn(message: string, context?: unknown): void {
    console.warn(`[${formatTimestamp()}] WARN  | ${message}`, context ?? "")
    writeToFile("WARN", message, context)
  },

  info(message: string, context?: unknown): void {
    if (isDev) {
      console.log(`[${formatTimestamp()}] INFO  | ${message}`, context ?? "")
    }
    writeToFile("INFO", message, context)
  },
}

// --------------- Global process-level handlers ---------------
if (typeof process !== "undefined") {
  process.on("uncaughtException", (err: Error) => {
    logger.error(`Uncaught Exception: ${err.message}`, {
      stack: err.stack,
      name: err.name,
    })
  })

  process.on("unhandledRejection", (reason: unknown) => {
    const msg = reason instanceof Error ? reason.message : String(reason)
    const stack = reason instanceof Error ? reason.stack : undefined
    logger.error(`Unhandled Rejection: ${msg}`, stack ? { stack } : undefined)
  })
}

export default logger
