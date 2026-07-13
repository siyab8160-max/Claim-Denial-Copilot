const isDev = process.env.NODE_ENV !== "production";

/**
 * Centralized logger that prints outputs only in the development environment.
 * Ensures production container logs remain clean and clutter-free.
 */
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
};
