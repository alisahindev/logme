import { LOG_CODES } from '../enums/LogCodes';

// Extract literal types from the LOG_CODES
export type EnvType = typeof LOG_CODES.ENV[keyof typeof LOG_CODES.ENV];
export type ServiceType = typeof LOG_CODES.SERVICE[keyof typeof LOG_CODES.SERVICE];
export type CategoryType = typeof LOG_CODES.CATEGORY[keyof typeof LOG_CODES.CATEGORY];
export type ActionType = typeof LOG_CODES.ACTION[keyof typeof LOG_CODES.ACTION];
export type OutcomeType = typeof LOG_CODES.OUTCOME[keyof typeof LOG_CODES.OUTCOME];
export type SeverityType = typeof LOG_CODES.SEVERITY[keyof typeof LOG_CODES.SEVERITY];

// LogCode string format
export type LogCode = `${EnvType}.${ServiceType}.${CategoryType}.${ActionType}.${OutcomeType}.${SeverityType}`;

// Log level mapping
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Config for fetch logger
export interface FetchLoggerConfig {
  logFunctionName?: boolean;
  logRequestResponse?: boolean;
  logParameters?: boolean;
  logResponseContent?: boolean;
}

// Standard log data structure
export interface LogData {
  timestamp: string;
  code: LogCode;
  message: string;
  level: LogLevel;
  correlationId: string;
  data?: Record<string, any>;
}

// Request specific log data
export interface RequestLogData extends LogData {
  data: {
    method: string;
    url: string;
    stack?: string;
    [key: string]: any;
  };
}

// Response specific log data
export interface ResponseLogData extends LogData {
  data: {
    method: string;
    url: string;
    status: number;
    statusText: string;
    duration: string;
    [key: string]: any;
  };
}

// Error specific log data
export interface ErrorLogData extends LogData {
  data: {
    method: string;
    url: string;
    error: string;
    stack?: string;
    duration?: string;
    calledFrom?: string;
    [key: string]: any;
  };
} 