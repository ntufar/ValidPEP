// backend/src/utils/logger.ts

// A simple console-based logger for now.
// In a production environment, this would integrate with a more robust logging service.

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message: string, error: unknown, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
};
