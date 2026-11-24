// Tiny logger: one line per event, with a timestamp and optional details.
// Pass { requestId } in details to link a log line to a request.
type Details = Record<string, unknown>;

function write(level: "info" | "warn" | "error", message: string, details?: Details) {
  const time = new Date().toISOString();
  const line = `[${time}] ${level.toUpperCase()} ${message}`;
  const out = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (details && Object.keys(details).length > 0) out(line, details);
  else out(line);
}

export const logger = {
  info: (message: string, details?: Details) => write("info", message, details),
  warn: (message: string, details?: Details) => write("warn", message, details),
  error: (message: string, details?: Details) => write("error", message, details),
};
