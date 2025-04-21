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

// Import FetchLogger directly
import { createFetchProxy as fetchProxyImpl } from './utils/FetchLogger';

// Conditionally export the fetch logger based on environment
// This approach works better with static analysis tools and bundlers
export const createFetchProxy = typeof window !== 'undefined' && typeof window.fetch === 'function'
  ? fetchProxyImpl
  : () => {
      console.warn('createFetchProxy is only available in browser environments');
      return null;
    };
  