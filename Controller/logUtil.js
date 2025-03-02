
/**
 * Enhanced logging utility for debugging
 */

// Enable debug logs
const DEBUG = true;

// Log levels
const LEVELS = {
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

// Utility for formatting dates
const formatDate = () => {
  const now = new Date();
  return now.toISOString();
};

// Main logger function
export const log = (level, module, message, data) => {
  // Only log DEBUG level if DEBUG is enabled
  if (level === LEVELS.DEBUG && !DEBUG) return;
  
  const timestamp = formatDate();
  const prefix = `[${timestamp}] [${level}] [${module}]`;
  
  if (data !== undefined) {
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : data.toString();
    console.log(`${prefix} ${message} ${dataStr}`);
  } else {
    console.log(`${prefix} ${message}`);
  }
};

// Convenience methods
export const info = (module, message, data) => log(LEVELS.INFO, module, message, data);
export const debug = (module, message, data) => log(LEVELS.DEBUG, module, message, data);
export const warn = (module, message, data) => log(LEVELS.WARN, module, message, data);
export const error = (module, message, data) => log(LEVELS.ERROR, module, message, data);

// Export a factory for creating module-specific loggers
export const createLogger = (moduleName) => ({
  info: (message, data) => info(moduleName, message, data),
  debug: (message, data) => debug(moduleName, message, data),
  warn: (message, data) => warn(moduleName, message, data),
  error: (message, data) => error(moduleName, message, data)
});

export default {
  log,
  info,
  debug,
  warn,
  error,
  createLogger,
  LEVELS
};
