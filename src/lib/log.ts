export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = Record<string, unknown>;

const REDACTED = "[REDACTED]";
const SENSITIVE_KEY =
  /(?:password|passphrase|secret|token|authorization|cookie|session|api[-_]?key|private[-_]?key|credential|database[-_]?url|connection[-_]?string|email|phone|address|medical|diagnosis|symptom|medication|title|body)/i;
const EMAIL_PATTERN = /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi;
const BEARER_PATTERN = /(bearer\s+)[^\s,;]+/gi;
const SECRET_ASSIGNMENT_PATTERN =
  /((?:password|passphrase|secret|token|authorization|cookie|api[-_]?key)\s*[:=]\s*)(["']?)[^\s,;"'}\]]+/gi;

function redactText(value: string): string {
  return value
    .replace(EMAIL_PATTERN, REDACTED)
    .replace(BEARER_PATTERN, `$1${REDACTED}`)
    .replace(SECRET_ASSIGNMENT_PATTERN, `$1${REDACTED}`);
}

function redactError(value: Error): Record<string, unknown> {
  return {
    name: value.name,
    message: redactText(value.message),
    ...(value.stack ? { stack: redactText(value.stack) } : {}),
    ...(value.cause ? { cause: redact(value.cause) } : {}),
  };
}

export function redact(value: unknown, stack = new Set<object>()): unknown {
  if (typeof value === "string") return redactText(value);
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof RegExp) return value.toString();
  if (value instanceof URL) return redactText(value.toString());
  if (stack.has(value)) return "[Circular]";
  if (stack.size > 32) return "[Truncated]";

  stack.add(value);
  let output: unknown;
  if (value instanceof Error) {
    output = redactError(value);
  } else if (Array.isArray(value)) {
    output = value.map((item) => redact(item, stack));
  } else {
    const entries: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      entries[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(entry, stack);
    }
    output = entries;
  }
  stack.delete(value);
  return output;
}

function write(level: LogLevel, message: unknown, context?: LogContext): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message: typeof message === "string" ? redactText(message) : redact(message),
    ...(context === undefined ? {} : { context: redact(context) }),
  };
  const output = JSON.stringify(payload);
  const method = console[level] ?? console.log;
  method(output);
}

export const log = {
  debug: (message: unknown, context?: LogContext) => write("debug", message, context),
  info: (message: unknown, context?: LogContext) => write("info", message, context),
  warn: (message: unknown, context?: LogContext) => write("warn", message, context),
  error: (message: unknown, context?: LogContext) => write("error", message, context),
};

export const logger = log;
