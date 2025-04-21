import { LOG_CODES } from '../enums/LogCodes';
import { LogCode } from '../types/LogTypes';
import { parseLogCode } from './LogUtils';

/**
 * Interface for decoded log code segments
 */
export interface DecodedLogSegment {
  code: string;
  key?: string;
  description: string;
}

/**
 * Complete decoded log code with all segments
 */
export interface DecodedLogCode {
  code: LogCode;
  env: DecodedLogSegment;
  service: DecodedLogSegment;
  category: DecodedLogSegment;
  action: DecodedLogSegment;
  outcome: DecodedLogSegment; 
  severity: DecodedLogSegment;
}

// Maps environment codes to keys and descriptions
const ENV_MAP = new Map(Object.entries(LOG_CODES.ENV).map(([key, code]) => [
  code, 
  { key, description: key === 'FE' ? 'Frontend' : 'Backend' }
]));

// Maps service codes to keys and descriptions 
const SERVICE_MAP = new Map(Object.entries(LOG_CODES.SERVICE).map(([key, code]) => [
  code, 
  { key, description: `${key.charAt(0)}${key.slice(1).toLowerCase()} Service` }
]));

// Maps category codes to keys and descriptions
const CATEGORY_MAP = new Map([
  [LOG_CODES.CATEGORY.REQUEST, { key: 'REQUEST', description: 'HTTP Request' }],
  [LOG_CODES.CATEGORY.RESPONSE, { key: 'RESPONSE', description: 'HTTP Response' }],
]);

// Maps action codes to keys and descriptions
const ACTION_MAP = new Map([
  [LOG_CODES.ACTION.SEND, { key: 'SEND', description: 'Send HTTP request' }],
  [LOG_CODES.ACTION.RECEIVE, { key: 'RECEIVE', description: 'Receive HTTP response' }],
  [LOG_CODES.ACTION.ERROR, { key: 'ERROR', description: 'Error in HTTP communication' }],
]);

// Maps outcome codes to keys and descriptions
const OUTCOME_MAP = new Map([
  [LOG_CODES.OUTCOME.SUCCESS, { key: 'SUCCESS', description: 'Successful operation' }],
  [LOG_CODES.OUTCOME.FAILURE, { key: 'FAILURE', description: 'Failed operation' }],
  [LOG_CODES.OUTCOME.INVALID, { key: 'INVALID', description: 'Invalid operation' }],
  [LOG_CODES.OUTCOME.TIMEOUT, { key: 'TIMEOUT', description: 'Operation timed out' }],
]);

// Maps severity codes to keys and descriptions
const SEVERITY_MAP = new Map([
  [LOG_CODES.SEVERITY.INFO, { key: 'INFO', description: 'Informational' }],
  [LOG_CODES.SEVERITY.WARN, { key: 'WARN', description: 'Warning' }],
  [LOG_CODES.SEVERITY.ERROR, { key: 'ERROR', description: 'Error' }],
  [LOG_CODES.SEVERITY.DEBUG, { key: 'DEBUG', description: 'Debug' }],
]);

/**
 * Decodes a log code into a human-readable format with descriptions
 */
export function decodeLogCode(code: string): DecodedLogCode | null {
  const parsedCode = parseLogCode(code);
  
  if (!parsedCode) {
    return null;
  }
  
  const { env, service, category, action, outcome, severity } = parsedCode;
  
  return {
    code: code as LogCode,
    env: { 
      code: env, 
      key: ENV_MAP.get(env)?.key,
      description: ENV_MAP.get(env)?.description || 'Unknown Environment' 
    },
    service: { 
      code: service, 
      key: SERVICE_MAP.get(service)?.key,
      description: SERVICE_MAP.get(service)?.description || 'Unknown Service' 
    },
    category: { 
      code: category, 
      key: CATEGORY_MAP.get(category)?.key,
      description: CATEGORY_MAP.get(category)?.description || 'Unknown Category' 
    },
    action: { 
      code: action, 
      key: ACTION_MAP.get(action)?.key,
      description: ACTION_MAP.get(action)?.description || 'Unknown Action' 
    },
    outcome: { 
      code: outcome, 
      key: OUTCOME_MAP.get(outcome)?.key,
      description: OUTCOME_MAP.get(outcome)?.description || 'Unknown Outcome' 
    },
    severity: { 
      code: severity, 
      key: SEVERITY_MAP.get(severity)?.key,
      description: SEVERITY_MAP.get(severity)?.description || 'Unknown Severity' 
    }
  };
}

/**
 * Returns a human-readable description of the entire log code
 */
export function getLogCodeDescription(code: string): string {
  const decoded = decodeLogCode(code);
  
  if (!decoded) {
    return 'Invalid log code format';
  }
  
  return `${decoded.env.description} ${decoded.service.description} - ${decoded.action.description} ${decoded.category.description} - ${decoded.outcome.description} (${decoded.severity.description})`;
}

/**
 * Formats a log code for console display
 */
export function formatLogCodeForConsole(code: string): void {
  const decoded = decodeLogCode(code);
  
  if (!decoded) {
    console.error('Invalid log code format:', code);
    return;
  }
  
  console.group(`Log Code: ${code}`);
  console.table([
    { segment: 'Environment', code: decoded.env.code, key: decoded.env.key, description: decoded.env.description },
    { segment: 'Service', code: decoded.service.code, key: decoded.service.key, description: decoded.service.description },
    { segment: 'Category', code: decoded.category.code, key: decoded.category.key, description: decoded.category.description },
    { segment: 'Action', code: decoded.action.code, key: decoded.action.key, description: decoded.action.description },
    { segment: 'Outcome', code: decoded.outcome.code, key: decoded.outcome.key, description: decoded.outcome.description },
    { segment: 'Severity', code: decoded.severity.code, key: decoded.severity.key, description: decoded.severity.description },
  ]);
  console.groupEnd();
} 