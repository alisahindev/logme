import { LOG_CODES } from '../enums/LogCodes';
import { ErrorLogData, RequestLogData, ResponseLogData } from '../types/LogTypes';
import {
    createLogData,
    generateCorrelationId,
    generateLogCode,
    logToConsole
} from './LogUtils';

/**
 * Server logger configuration options
 */
export interface ServerLoggerConfig {
  logRequestBody?: boolean;
  logResponseBody?: boolean;
  logHeaders?: boolean;
  excludePaths?: string[];
  excludeRequestBody?: string[];
  excludeResponseBody?: string[];
  customIDHeader?: string;
}

// Default configuration
const defaultConfig: ServerLoggerConfig = {
  logRequestBody: false,
  logResponseBody: false,
  logHeaders: false,
  excludePaths: ['/health', '/metrics', '/favicon.ico'],
  excludeRequestBody: [],
  excludeResponseBody: [],
  customIDHeader: 'X-Correlation-ID'
};

/**
 * Creates Express middleware for HTTP request/response logging
 * @param config ServerLoggerConfig with configuration options
 * @returns Express middleware function
 */
export function createExpressLogger(config: ServerLoggerConfig = defaultConfig) {
  const mergedConfig = { ...defaultConfig, ...config };
  
  return (req: any, res: any, next: () => void) => {
    const startTime = Date.now();
    
    // Get or create a correlation ID
    const correlationId = 
      req.headers[mergedConfig.customIDHeader?.toLowerCase() ?? ''] || 
      generateCorrelationId('express');
    
    // Add correlation ID to request for use in other middleware/routes
    req.correlationId = correlationId;
    
    // Add to response headers
    res.setHeader(mergedConfig.customIDHeader ?? 'X-Correlation-ID', correlationId);
    
    // Skip excluded paths
    if (mergedConfig.excludePaths?.some(path => req.path.includes(path))) {
      return next();
    }
    
    // Log request
    logServerRequest(req, correlationId, mergedConfig);
    
    // Capture the original methods to restore later
    const originalEnd = res.end;
    const originalWrite = res.write;
    
    // Collect response body if configured
    const chunks: Buffer[] = [];
    
    // Override write method to capture response body chunks
    if (mergedConfig.logResponseBody) {
      res.write = function(chunk: any, ...args: any[]) {
        if (chunk) {
          chunks.push(Buffer.from(chunk));
        }
        return originalWrite.apply(res, [chunk, ...args]);
      };
    }
    
    // Override end method to log response
    res.end = function(chunk: any, ...args: any[]) {
      // Restore original methods
      res.write = originalWrite;
      res.end = originalEnd;
      
      // Calculate request duration
      const duration = Date.now() - startTime;
      
      // Capture the final chunk if exists
      if (mergedConfig.logResponseBody && chunk) {
        chunks.push(Buffer.from(chunk));
      }
      
      // Execute original end method
      const result = originalEnd.apply(res, [chunk, ...args]);
      
      // Collect response body if configured
      let responseBody;
      if (mergedConfig.logResponseBody && !mergedConfig.excludeResponseBody?.some(path => req.path.includes(path))) {
        try {
          const buffer = Buffer.concat(chunks);
          const contentType = res.getHeader('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            responseBody = JSON.parse(buffer.toString('utf8'));
          } else if (contentType && contentType.includes('text/')) {
            responseBody = buffer.toString('utf8').substring(0, 1000) + 
              (buffer.length > 1000 ? '... (truncated)' : '');
          } else {
            responseBody = `Binary data or unsupported content type: ${contentType}`;
          }
        } catch (err) {
          responseBody = 'Error parsing response body';
        }
      }
      
      // Log response
      logServerResponse(req, res, duration, correlationId, responseBody, mergedConfig);
      
      return result;
    };
    
    // Continue to next middleware
    next();
  };
}

/**
 * Log server request information
 */
function logServerRequest(req: any, correlationId: string, config: ServerLoggerConfig): void {
  const { method, originalUrl, headers, body } = req;
  
  // Create standard request log
  const requestLogCode = generateLogCode(
    LOG_CODES.ENV.BE,
    LOG_CODES.SERVICE.API,
    LOG_CODES.CATEGORY.REQUEST,
    LOG_CODES.ACTION.RECEIVE,
    LOG_CODES.OUTCOME.SUCCESS,
    LOG_CODES.SEVERITY.INFO
  );
  
  const logData: Record<string, any> = {
    method,
    url: originalUrl,
    ip: req.ip || req.connection?.remoteAddress || '-',
    userAgent: headers['user-agent'] || '-'
  };
  
  // Add headers if configured
  if (config.logHeaders) {
    logData.headers = headers;
  }
  
  // Add request body if configured and not excluded
  if (config.logRequestBody && 
      !config.excludeRequestBody?.some(path => req.path.includes(path)) && 
      body) {
    logData.body = sanitizeBody(body);
  }
  
  const requestLogData = createLogData(
    requestLogCode,
    `${method} request to ${originalUrl}`,
    correlationId,
    logData
  ) as RequestLogData;
  
  logToConsole(requestLogData);
}

/**
 * Log server response information
 */
function logServerResponse(
  req: any, 
  res: any, 
  duration: number, 
  correlationId: string,
  responseBody?: any,
  config?: ServerLoggerConfig
): void {
  const { method, originalUrl } = req;
  const statusCode = res.statusCode;
  
  // Determine log severity and outcome based on status code
  const severity = statusCode >= 500 
    ? LOG_CODES.SEVERITY.ERROR 
    : statusCode >= 400 
      ? LOG_CODES.SEVERITY.WARN 
      : LOG_CODES.SEVERITY.INFO;
      
  const outcome = statusCode >= 400 
    ? LOG_CODES.OUTCOME.FAILURE 
    : LOG_CODES.OUTCOME.SUCCESS;
  
  const responseLogCode = generateLogCode(
    LOG_CODES.ENV.BE,
    LOG_CODES.SERVICE.API,
    LOG_CODES.CATEGORY.RESPONSE,
    LOG_CODES.ACTION.SEND,
    outcome,
    severity
  );
  
  const logData: Record<string, any> = {
    method,
    url: originalUrl,
    status: statusCode,
    duration: `${duration}ms`
  };
  
  // Add headers if configured
  if (config?.logHeaders) {
    // Use getHeaders() if available (Express) or _headers (Node.js)
    logData.headers = typeof res.getHeaders === 'function' 
      ? res.getHeaders() 
      : res._headers || {};
  }
  
  // Add response body if provided
  if (responseBody !== undefined) {
    logData.body = sanitizeBody(responseBody);
  }
  
  const responseLogData = createLogData(
    responseLogCode,
    `${method} response sent for ${originalUrl} with status ${statusCode}`,
    correlationId,
    logData
  ) as ResponseLogData;
  
  logToConsole(responseLogData);
}

/**
 * Error handler middleware for Express
 */
export function expressErrorLogger(config: ServerLoggerConfig = defaultConfig) {
  return (err: Error, req: any, res: any, next: (err?: Error) => void) => {
    const correlationId = req.correlationId || generateCorrelationId('express-error');
    
    // Log error details
    const errorLogCode = generateLogCode(
      LOG_CODES.ENV.BE,
      LOG_CODES.SERVICE.API,
      LOG_CODES.CATEGORY.REQUEST,
      LOG_CODES.ACTION.ERROR,
      LOG_CODES.OUTCOME.FAILURE,
      LOG_CODES.SEVERITY.ERROR
    );
    
    const errorLogData = createLogData(
      errorLogCode,
      `Error processing ${req.method} request to ${req.originalUrl}`,
      correlationId,
      {
        method: req.method,
        url: req.originalUrl,
        error: err.message,
        stack: err.stack,
        ...(config.logHeaders ? { headers: req.headers } : {})
      }
    ) as ErrorLogData;
    
    logToConsole(errorLogData);
    
    // Continue to the next error handler
    next(err);
  };
}

/**
 * Creates a middleware for logging database operations
 */
export function createDatabaseLogger(dbType: string = 'generic') {
  return {
    logQuery: function(query: string, params?: any[], correlationId?: string): void {
      const queryLogCode = generateLogCode(
        LOG_CODES.ENV.BE,
        LOG_CODES.SERVICE.API,
        LOG_CODES.CATEGORY.REQUEST,
        LOG_CODES.ACTION.SEND,
        LOG_CODES.OUTCOME.SUCCESS,
        LOG_CODES.SEVERITY.DEBUG
      );
      
      const logCorrelationId = correlationId || generateCorrelationId('db-query');
      
      const queryLogData = createLogData(
        queryLogCode,
        `${dbType} query executed`,
        logCorrelationId,
        {
          query: query.substring(0, 1000) + (query.length > 1000 ? '... (truncated)' : ''),
          params: params ? sanitizeParams(params) : undefined
        }
      );
      
      logToConsole(queryLogData);
    },
    
    logQueryError: function(query: string, error: Error, params?: any[], correlationId?: string): void {
      const errorLogCode = generateLogCode(
        LOG_CODES.ENV.BE,
        LOG_CODES.SERVICE.API,
        LOG_CODES.CATEGORY.REQUEST,
        LOG_CODES.ACTION.ERROR,
        LOG_CODES.OUTCOME.FAILURE,
        LOG_CODES.SEVERITY.ERROR
      );
      
      const logCorrelationId = correlationId || generateCorrelationId('db-error');
      
      const errorLogData = createLogData(
        errorLogCode,
        `${dbType} query error: ${error.message}`,
        logCorrelationId,
        {
          query: query.substring(0, 1000) + (query.length > 1000 ? '... (truncated)' : ''),
          error: error.message,
          stack: error.stack,
          params: params ? sanitizeParams(params) : undefined
        }
      );
      
      logToConsole(errorLogData);
    }
  };
}

/**
 * Sanitize sensitive data in objects by replacing values for keys that match patterns
 */
function sanitizeBody(data: any): any {
  if (!data) return data;
  
  // For strings, return as is
  if (typeof data !== 'object') return data;
  
  // Clone to avoid modifying original
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  const sensitiveKeys = [
    /pass(word)?/i,
    /secret/i,
    /token/i,
    /auth/i,
    /key/i,
    /credential/i,
    /ssn/i,
    /social.*security/i,
    /card/i,
    /cvv/i
  ];
  
  // Process object recursively
  Object.keys(sanitized).forEach(key => {
    // Check if current key is sensitive
    if (sensitiveKeys.some(pattern => pattern.test(key))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeBody(sanitized[key]);
    }
  });
  
  return sanitized;
}

/**
 * Sanitize query parameters to prevent logging sensitive data
 */
function sanitizeParams(params: any[]): any[] {
  return params.map(param => {
    if (typeof param === 'object' && param !== null) {
      return sanitizeBody(param);
    }
    return param;
  });
} 