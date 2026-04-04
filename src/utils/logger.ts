/**
 * Centralized logging utility.
 *
 * In development: logs to console
 * In production: can be configured to send to monitoring service
 */

const isDev = __DEV__;

/**
 * Log an error with context.
 */
export function logError(message: string, error?: unknown): void {
  if (isDev) {
    console.error(message, error);
  }
  // In production, could send to Sentry, Bugsnag, etc.
}

/**
 * Log a warning.
 */
export function logWarn(message: string, data?: unknown): void {
  if (isDev) {
    console.warn(message, data);
  }
}

/**
 * Log informational message (dev only).
 */
export function logInfo(message: string, data?: unknown): void {
  if (isDev) {
    console.log(message, data);
  }
}
