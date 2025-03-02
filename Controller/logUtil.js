
/**
 * Enhanced logging utility for debugging and tracing
 */

// Different log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE'
};

// Configure the current log level (adjust as needed)
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL || LOG_LEVELS.DEBUG;

// Log level priorities
const LOG_LEVEL_PRIORITY = {
  [LOG_LEVELS.ERROR]: 0,
  [LOG_LEVELS.WARN]: 1,
  [LOG_LEVELS.INFO]: 2,
  [LOG_LEVELS.DEBUG]: 3,
  [LOG_LEVELS.TRACE]: 4
};

// ANSI color codes for console output
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  GREEN: '\x1b[32m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  BRIGHT_RED: '\x1b[91m',
  BRIGHT_GREEN: '\x1b[92m',
  BRIGHT_YELLOW: '\x1b[93m',
  BRIGHT_BLUE: '\x1b[94m'
};

/**
 * Determines if a log at the given level should be shown
 */
const shouldLog = (level) => {
  return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL];
};

/**
 * Format a log message with timestamp, level, and module name
 */
const formatLogMessage = (level, module, message) => {
  const timestamp = new Date().toISOString();
  let color = COLORS.WHITE;
  
  switch(level) {
    case LOG_LEVELS.ERROR:
      color = COLORS.BRIGHT_RED;
      break;
    case LOG_LEVELS.WARN:
      color = COLORS.BRIGHT_YELLOW;
      break;
    case LOG_LEVELS.INFO:
      color = COLORS.BRIGHT_GREEN;
      break;
    case LOG_LEVELS.DEBUG:
      color = COLORS.BRIGHT_BLUE;
      break;
    case LOG_LEVELS.TRACE:
      color = COLORS.CYAN;
      break;
  }
  
  return `${color}[${timestamp}] [${level}] [${module}]${COLORS.RESET} ${message}`;
};

/**
 * General purpose logging function
 */
const log = (level, module, message, data = null) => {
  if (!shouldLog(level)) return;
  
  const formattedMessage = formatLogMessage(level, module, message);
  
  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(formattedMessage);
      if (data) console.error(data);
      break;
    case LOG_LEVELS.WARN:
      console.warn(formattedMessage);
      if (data) console.warn(data);
      break;
    case LOG_LEVELS.INFO:
      console.log(formattedMessage);
      if (data) console.log(data);
      break;
    case LOG_LEVELS.DEBUG:
    case LOG_LEVELS.TRACE:
    default:
      console.log(formattedMessage);
      if (data) console.log(data);
  }
};

/**
 * Logger factory that creates a logger for a specific module
 */
const createLogger = (moduleName) => {
  return {
    error: (message, data = null) => log(LOG_LEVELS.ERROR, moduleName, message, data),
    warn: (message, data = null) => log(LOG_LEVELS.WARN, moduleName, message, data),
    info: (message, data = null) => log(LOG_LEVELS.INFO, moduleName, message, data),
    debug: (message, data = null) => log(LOG_LEVELS.DEBUG, moduleName, message, data),
    trace: (message, data = null) => log(LOG_LEVELS.TRACE, moduleName, message, data)
  };
};

/**
 * Helper to log database operations
 */
const logDbOperation = (logger, operation, tableName, data = null, error = null) => {
  if (error) {
    logger.error(`${operation} operation failed on ${tableName}`, { error, data });
    return;
  }
  
  logger.debug(`${operation} operation successful on ${tableName}`, { data });
};

/**
 * Function to inspect database record count
 */
const inspectDatabaseTable = async (supabase, tableName) => {
  try {
    console.log(`${COLORS.BRIGHT_YELLOW}Checking for ${tableName} in database...${COLORS.RESET}`);
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error(`${COLORS.BRIGHT_RED}Error checking ${tableName}: ${error.message}${COLORS.RESET}`);
      return;
    }
    
    console.log(`${COLORS.BRIGHT_YELLOW}Total ${tableName} in database: ${COLORS.BRIGHT_GREEN}${count}${COLORS.RESET}`);
    if (count === 0) {
      console.log(`${COLORS.BRIGHT_YELLOW}No ${tableName} found in database.${COLORS.RESET}`);
    }
    
    return { count, error };
  } catch (err) {
    console.error(`${COLORS.BRIGHT_RED}Failed to inspect ${tableName}: ${err.message}${COLORS.RESET}`);
  }
};

export {
  createLogger,
  LOG_LEVELS,
  logDbOperation,
  inspectDatabaseTable
};
