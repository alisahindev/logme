import { LOG_CODES } from '../enums/LogCodes';
import {
    ActionType,
    CategoryType,
    EnvType,
    LogCode,
    LogData,
    LogLevel,
    OutcomeType,
    ServiceType,
    SeverityType
} from '../types/LogTypes';

/**
 * Generates a standard log code based on the provided parameters
 */
export function generateLogCode(
  env: EnvType,
  service: ServiceType,
  category: CategoryType,
  action: ActionType,
  outcome: OutcomeType,
  severity: SeverityType
): LogCode {
  return `${env}.${service}.${category}.${action}.${outcome}.${severity}` as LogCode;
}

/**
 * Validates if a given string is a valid log code format
 */
export function isValidLogCode(code: string): code is LogCode {
  return /^[A-Z]{2}\.\d{4}\.\d{2}\.\d{2}\.\d{2}\.[IWED]$/.test(code);
}

/**
 * Parses a log code string into its individual components
 */
export function parseLogCode(code: string): { 
  env: EnvType; 
  service: ServiceType; 
  category: CategoryType; 
  action: ActionType; 
  outcome: OutcomeType; 
  severity: SeverityType 
} | null {
  if (!isValidLogCode(code)) {
    return null;
  }

  const [env, service, category, action, outcome, severity] = code.split('.');
  
  return {
    env: env as EnvType,
    service: service as ServiceType,
    category: category as CategoryType,
    action: action as ActionType,
    outcome: outcome as OutcomeType,
    severity: severity as SeverityType
  };
}

/**
 * Maps severity code to log level
 */
export function mapSeverityToLogLevel(severity: SeverityType): LogLevel {
  const mapping: Record<SeverityType, LogLevel> = {
    [LOG_CODES.SEVERITY.INFO]: 'info',
    [LOG_CODES.SEVERITY.WARN]: 'warn',
    [LOG_CODES.SEVERITY.ERROR]: 'error',
    [LOG_CODES.SEVERITY.DEBUG]: 'debug'
  };
  
  return mapping[severity];
}

/**
 * Generates a correlation ID for request tracking
 */
export function generateCorrelationId(prefix: string = 'log'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Creates a standard log data object
 */
export function createLogData(
  code: LogCode, 
  message: string, 
  correlationId: string,
  data?: Record<string, any>
): LogData {
  const parsedCode = parseLogCode(code);
  
  if (!parsedCode) {
    throw new Error(`Invalid log code format: ${code}`);
  }
  
  const level = mapSeverityToLogLevel(parsedCode.severity);
  
  return {
    timestamp: new Date().toISOString(),
    code,
    message,
    level,
    correlationId,
    data
  };
}

/**
 * Formats and logs a standard log object to console
 */
export function logToConsole(logData: LogData): void {
  const { level } = logData;
  
  if (level === 'error') {
    console.error(JSON.stringify(logData));
  } else {
    console.log(JSON.stringify(logData));
  }
} 