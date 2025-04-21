// Re-export all types
export * from './types/LogTypes';

// Re-export enums
export { LOG_CODES } from './enums/LogCodes';

// Re-export utility functions
export {
  createLogData, generateCorrelationId, generateLogCode,
  isValidLogCode, logToConsole, mapSeverityToLogLevel, parseLogCode
} from './utils/LogUtils';

// Re-export LogDecoder utilities
export {
  decodeLogCode, formatLogCodeForConsole, getLogCodeDescription
} from './utils/LogDecoder';
export type {
  DecodedLogCode, DecodedLogSegment
} from './utils/LogDecoder';

// Re-export ServerLogger utilities
export { createDatabaseLogger, createExpressLogger, expressErrorLogger } from './utils/ServerLogger';
export type {
  ServerLoggerConfig
} from './utils/ServerLogger';

// Only export fetch logger in browser environments
let createFetchProxy: any;

// Check if window exists (browser environment)
if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  // Dynamic import to avoid errors in Node.js environment
  import('./utils/FetchLogger').then(module => {
    createFetchProxy = module.createFetchProxy;
  });
}

export { createFetchProxy };
  