import { LOG_CODES } from '../enums/LogCodes';
import { ErrorLogData, FetchLoggerConfig, RequestLogData, ResponseLogData } from '../types/LogTypes';
import {
  createLogData,
  generateCorrelationId,
  generateLogCode,
  logToConsole
} from './LogUtils';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.fetch === 'function';

// Default configuration options
const defaultConfig: FetchLoggerConfig = {
  logFunctionName: true,
  logRequestResponse: true,
  logParameters: false,
  logResponseContent: false,
};

/**
 * Helper function to convert Headers to a plain object
 */
function headersToObject(headers: Headers | Record<string, string> | string[][] | undefined): Record<string, string> {
  if (!headers) {
    return {};
  }
  
  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    // Headers.forEach is supported in all browsers
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  } else if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  } else {
    return headers as Record<string, string>;
  }
}

/**
 * Creates a proxy around the fetch API to add standardized logging
 * Only works in browser environments
 */
export const createFetchProxy = (config: FetchLoggerConfig = defaultConfig) => {
  // Return early if not in a browser
  if (!isBrowser) {
    console.warn('createFetchProxy is only available in browser environments. Skipping setup.');
    // Return a no-op function to avoid errors
    return window.fetch;
  }

  // Merge provided config with defaults
  const mergedConfig: FetchLoggerConfig = {...defaultConfig, ...config};
  const originalFetch = window.fetch;

  const proxyFetch = new Proxy(originalFetch, {
    apply: async (target, thisArg, argumentsList: [RequestInfo | URL, RequestInit?]) => {
      const [url, options] = argumentsList;
      const method = options?.method || 'GET';
      const start = performance.now();
      const stack = new Error().stack?.split("\n")[2]?.trim();
      
      // Generate request correlation ID
      const correlationId = generateCorrelationId('fetch');

      // Log Request Details
      if (mergedConfig.logRequestResponse) {
        // Create standard request log
        const requestLogCode = generateLogCode(
          LOG_CODES.ENV.FE,
          LOG_CODES.SERVICE.FETCH,
          LOG_CODES.CATEGORY.REQUEST,
          LOG_CODES.ACTION.SEND,
          LOG_CODES.OUTCOME.SUCCESS,
          LOG_CODES.SEVERITY.INFO
        );
        
        const requestLogData = createLogData(
          requestLogCode,
          `${method} request to ${typeof url === 'string' ? url : url.toString()}`,
          correlationId,
          {
            method,
            url: typeof url === 'string' ? url : url.toString(),
            stack
          }
        ) as RequestLogData;
        
        logToConsole(requestLogData);
        
        // Log parameters if enabled
        if (mergedConfig.logParameters) {
          logRequestParameters(url, method, options, correlationId);
        }
      }

      try {
        const response = await target.apply(thisArg, argumentsList);
        const duration = performance.now() - start;

        // Log Response Details
        if (mergedConfig.logRequestResponse) {
          logResponseDetails(url, method, response, duration, correlationId);
          
          // Log response content if enabled
          if (mergedConfig.logResponseContent) {
            logResponseContent(url, method, response, correlationId);
          }
        }

        if (mergedConfig.logFunctionName && stack) {
          logFunctionName(stack, correlationId);
        }

        return response;
      } catch (err: unknown) {
        const duration = performance.now() - start;
        logFetchError(url, method, err as Error, duration, stack, correlationId);
        throw err;
      }
    },
  });

  // Replace the global fetch with the proxy
  window.fetch = proxyFetch;

  return proxyFetch;
};

/**
 * Logs request parameters (headers, body) if enabled
 */
function logRequestParameters(
  url: RequestInfo | URL, 
  method: string, 
  options?: RequestInit, 
  correlationId?: string
): void {
  try {
    const headers = headersToObject(options?.headers);
    
    let bodyContent = options?.body;
    // Try to parse JSON body for better logging
    if (bodyContent && typeof bodyContent === 'string') {
      try {
        bodyContent = JSON.parse(bodyContent);
      } catch (e) {
        // Not JSON, keep as is
      }
    }
    
    const paramsLogCode = generateLogCode(
      LOG_CODES.ENV.FE,
      LOG_CODES.SERVICE.FETCH,
      LOG_CODES.CATEGORY.REQUEST,
      LOG_CODES.ACTION.SEND,
      LOG_CODES.OUTCOME.SUCCESS,
      LOG_CODES.SEVERITY.DEBUG
    );
    
    const paramsLogData = createLogData(
      paramsLogCode,
      `Request parameters for ${method} ${typeof url === 'string' ? url : url.toString()}`,
      correlationId || generateCorrelationId('fetch'),
      {
        url: typeof url === 'string' ? url : url.toString(),
        method,
        headers,
        body: bodyContent,
      }
    );
    
    logToConsole(paramsLogData);
  } catch (error) {
    // Log parameter parsing error
    const errorLogCode = generateLogCode(
      LOG_CODES.ENV.FE,
      LOG_CODES.SERVICE.FETCH,
      LOG_CODES.CATEGORY.REQUEST,
      LOG_CODES.ACTION.SEND,
      LOG_CODES.OUTCOME.FAILURE,
      LOG_CODES.SEVERITY.WARN
    );
    
    const errorLogData = createLogData(
      errorLogCode,
      `Error parsing request parameters`,
      correlationId || generateCorrelationId('fetch'),
      { error: (error as Error).message }
    );
    
    logToConsole(errorLogData);
  }
}

/**
 * Logs response details (status, duration)
 */
function logResponseDetails(
  url: RequestInfo | URL, 
  method: string, 
  response: Response, 
  duration: number, 
  correlationId: string
): void {
  const isSuccess = response.ok;
  const severity = isSuccess ? LOG_CODES.SEVERITY.INFO : LOG_CODES.SEVERITY.WARN;
  const outcome = isSuccess ? LOG_CODES.OUTCOME.SUCCESS : LOG_CODES.OUTCOME.FAILURE;
  
  // Create standard response log
  const responseLogCode = generateLogCode(
    LOG_CODES.ENV.FE,
    LOG_CODES.SERVICE.FETCH,
    LOG_CODES.CATEGORY.RESPONSE,
    LOG_CODES.ACTION.RECEIVE,
    outcome,
    severity
  );
  
  const responseLogData = createLogData(
    responseLogCode,
    `${method} response from ${typeof url === 'string' ? url : url.toString()} with status ${response.status}`,
    correlationId,
    {
      method,
      url: typeof url === 'string' ? url : url.toString(),
      status: response.status,
      statusText: response.statusText,
      duration: `${duration.toFixed(1)}ms`
    }
  ) as ResponseLogData;
  
  logToConsole(responseLogData);
}

/**
 * Logs response content if enabled
 */
async function logResponseContent(
  url: RequestInfo | URL, 
  method: string, 
  response: Response, 
  correlationId: string
): Promise<void> {
  try {
    // Clone the response to not consume the original
    const clonedResponse = response.clone();
    const headers = headersToObject(clonedResponse.headers);
    
    // Determine outcome based on response status
    const isSuccess = clonedResponse.ok;
    const outcome = isSuccess ? LOG_CODES.OUTCOME.SUCCESS : LOG_CODES.OUTCOME.FAILURE;
    
    const contentLogCode = generateLogCode(
      LOG_CODES.ENV.FE,
      LOG_CODES.SERVICE.FETCH,
      LOG_CODES.CATEGORY.RESPONSE,
      LOG_CODES.ACTION.RECEIVE,
      outcome,
      LOG_CODES.SEVERITY.DEBUG
    );
    
    let responseBody;
    const contentType = clonedResponse.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      responseBody = await clonedResponse.json();
    } else if (contentType.includes('text/')) {
      const textData = await clonedResponse.text();
      responseBody = textData.substring(0, 1000) + (textData.length > 1000 ? '... (truncated)' : '');
    } else {
      responseBody = `Binary data or unsupported content type: ${contentType}`;
    }
    
    const contentLogData = createLogData(
      contentLogCode,
      `Response content for ${method} ${typeof url === 'string' ? url : url.toString()}`,
      correlationId,
      {
        headers,
        body: responseBody
      }
    );
    
    logToConsole(contentLogData);
  } catch (error) {
    // Log content parsing error
    const errorLogCode = generateLogCode(
      LOG_CODES.ENV.FE,
      LOG_CODES.SERVICE.FETCH,
      LOG_CODES.CATEGORY.RESPONSE,
      LOG_CODES.ACTION.RECEIVE,
      LOG_CODES.OUTCOME.FAILURE,
      LOG_CODES.SEVERITY.WARN
    );
    
    const errorLogData = createLogData(
      errorLogCode,
      `Error parsing response content`,
      correlationId,
      { error: (error as Error).message }
    );
    
    logToConsole(errorLogData);
  }
}

/**
 * Logs fetch error information
 */
function logFetchError(
  url: RequestInfo | URL, 
  method: string, 
  error: Error, 
  duration: number, 
  stack?: string, 
  correlationId?: string
): void {
  const errorLogCode = generateLogCode(
    LOG_CODES.ENV.FE,
    LOG_CODES.SERVICE.FETCH,
    LOG_CODES.CATEGORY.REQUEST,
    LOG_CODES.ACTION.ERROR,
    LOG_CODES.OUTCOME.FAILURE,
    LOG_CODES.SEVERITY.ERROR
  );
  
  const errorLogData = createLogData(
    errorLogCode,
    `Error during ${method} request to ${typeof url === 'string' ? url : url.toString()}`,
    correlationId || generateCorrelationId('fetch'),
    {
      method,
      url: typeof url === 'string' ? url : url.toString(),
      error: error.message,
      stack: error.stack,
      duration: `${duration.toFixed(1)}ms`,
      calledFrom: stack
    }
  ) as ErrorLogData;
  
  logToConsole(errorLogData);
}

/**
 * Logs information about the function that called fetch
 */
function logFunctionName(stack: string, correlationId: string): void {
  const fnLogCode = generateLogCode(
    LOG_CODES.ENV.FE,
    LOG_CODES.SERVICE.FETCH,
    LOG_CODES.CATEGORY.REQUEST,
    LOG_CODES.ACTION.SEND,
    LOG_CODES.OUTCOME.SUCCESS,
    LOG_CODES.SEVERITY.DEBUG
  );
  
  const fnLogData = createLogData(
    fnLogCode,
    `Fetch called from function`,
    correlationId,
    { calledFrom: stack }
  );
  
  logToConsole(fnLogData);
} 