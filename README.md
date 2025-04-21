# LogMe

A standardized logging utility with a code-based logging system that provides consistent logging across different environments and services.

## Features

- 📦 **Standardized Logging Format**: Consistent log format with structured codes
- 🔍 **Semantic Decoding**: Human-readable descriptions for log codes
- 🌐 **Browser Support**: Fetch API logger for frontend applications
- 🖥️ **Node.js Support**: Server-side logging capabilities
- 📊 **Correlation Tracking**: Request correlation for easier debugging
- 🛠️ **CLI Tools**: Command-line interface for working with log codes
- 📜 **Schema Definitions**: JSON schema for interoperability

## Installation

```bash
npm install logme
```

## Usage

### Basic Logging

```typescript
import { createLogData, generateCorrelationId, logToConsole, LOG_CODES, generateLogCode } from 'logme';

// Create a log code
const logCode = generateLogCode(
  LOG_CODES.ENV.BE,
  LOG_CODES.SERVICE.AUTH,
  LOG_CODES.CATEGORY.REQUEST,
  LOG_CODES.ACTION.SEND,
  LOG_CODES.OUTCOME.SUCCESS,
  LOG_CODES.SEVERITY.INFO
);

// Generate a correlation ID
const correlationId = generateCorrelationId();

// Create log data
const logData = createLogData(
  logCode,
  'User login attempt',
  correlationId,
  { username: 'user@example.com' }
);

// Output log to console
logToConsole(logData);
```

### Fetch API Logging (Browser Only)

```typescript
import { createFetchProxy } from 'logme';

// Setup fetch logging
createFetchProxy({
  logRequestResponse: true,
  logParameters: true,
  logResponseContent: true,
  logFunctionName: true
});

// All fetch calls will now be logged
fetch('https://api.example.com/users')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Express Server Logging (Node.js)

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import { createExpressLogger, expressErrorLogger, createDatabaseLogger } from 'logme';

const app = express();

// Parse JSON bodies
app.use(bodyParser.json());

// Initialize the logger middleware with custom configuration
const logger = createExpressLogger({
  logRequestBody: true,
  logResponseBody: true,
  logHeaders: false,
  excludePaths: ['/health', '/metrics', '/favicon.ico'],
  customIDHeader: 'X-Request-ID'
});

// Create a database logger for SQL operations
const dbLogger = createDatabaseLogger('postgres');

// Apply the logger middleware to all routes
app.use(logger);

// Your route handlers
app.get('/api/users', (req, res) => {
  // Access the correlation ID from the request
  const { correlationId } = req;
  
  // Log database operations with the same correlation ID
  dbLogger.logQuery('SELECT * FROM users', [], correlationId);
  
  res.json({ users: [] });
});

// Apply error logger middleware (after routes)
app.use(expressErrorLogger());

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Database Operation Logging (Node.js)

```typescript
import { createDatabaseLogger } from 'logme';

// Create a database logger instance
const dbLogger = createDatabaseLogger('mongodb');

// Log a successful query
dbLogger.logQuery(
  'db.users.find({email: "user@example.com"})', 
  [{email: "user@example.com"}],
  'correlation-123'
);

// Log a query error
try {
  // Database operation that fails
  throw new Error('MongoDB connection failed');
} catch (error) {
  dbLogger.logQueryError(
    'db.users.find({email: "user@example.com"})',
    error,
    [{email: "user@example.com"}],
    'correlation-123'
  );
}
```

### Decoding Log Codes

```typescript
import { decodeLogCode, formatLogCodeForConsole, getLogCodeDescription } from 'logme';

// Get human-readable description
const description = getLogCodeDescription('BE.1003.01.01.01.I');
console.log(description); 
// "Backend Authentication Service - Send HTTP request - Successful operation (Informational)"

// Get detailed breakdown
const decoded = decodeLogCode('BE.1003.01.01.01.I');
console.log(decoded);
/*
{
  code: 'BE.1003.01.01.01.I',
  env: { code: 'BE', key: 'BE', description: 'Backend' },
  service: { code: '1003', key: 'AUTH', description: 'Authentication Service' },
  category: { code: '01', key: 'REQUEST', description: 'HTTP Request' },
  action: { code: '01', key: 'SEND', description: 'Send HTTP request' },
  outcome: { code: '01', key: 'SUCCESS', description: 'Successful operation' },
  severity: { code: 'I', key: 'INFO', description: 'Informational' }
}
*/

// Format for console display
formatLogCodeForConsole('BE.1003.01.01.01.I');
```

## Log Code Format

Log codes follow a standardized format:

```
<ENV>.<SERVICE>.<CATEGORY>.<ACTION>.<OUTCOME>.<SEVERITY>
```

Each segment has a specific purpose:

| Segment   | Format    | Description                                              | Example      |
|-----------|-----------|----------------------------------------------------------|------------|
| ENV       | 2 char    | Environment: FE (Frontend), BE (Backend)                | `BE`       |
| SERVICE   | 4 digit   | Service/domain code                                      | `1003`     |
| CATEGORY  | 2 digit   | Subcategory or feature                                  | `01`       |
| ACTION    | 2 digit   | Action type (fetch, create, delete)                     | `01`       |
| OUTCOME   | 2 digit   | Result (success, invalid, timeout)                      | `01`       |
| SEVERITY  | 1 char    | Log level: Info (I), Warn (W), Error (E), Debug (D)    | `I`        |

Example: `BE.1003.01.01.01.I` → Backend Auth service login attempt succeeded, info level.

## Command Line Interface

LogMe includes a CLI for working with log codes:

```bash
# Decode a log code
npx logme decode BE.1003.01.01.01.I

# List available log code segments
npx logme list

# List specific segment options
npx logme list service

# Generate a log code interactively
npx logme generate

# Build a log code with specific segments
npx logme build BE 1003 01 01 01 I
```

## Integration

### Using with TypeScript

The package includes TypeScript type definitions:

```typescript
import { LogCode, LogData, RequestLogData, ResponseLogData } from 'logme';

// Type-safe log code
const logCode: LogCode = 'BE.1003.01.01.01.I';
```

### Schema for Other Languages

We provide a JSON schema file for use with other languages:

```javascript
// In Node.js
const logCodes = require('logme/dist/log-codes.json');
console.log(logCodes.envs.BE.description); // "Backend"
```

### Next.js Integration (SSR and Client)

LogMe can be seamlessly integrated with Next.js applications, supporting both server-side rendering (SSR) and client-side operations:

```typescript
// lib/logger.js - Create a shared logger configuration
import { logToConsole, generateCorrelationId, createLogData, LOG_CODES, generateLogCode } from 'logme';

// Helper function to create and log data consistently
export function logger(logCode, message, data = {}) {
  const isClient = typeof window !== 'undefined';
  const correlationId = generateCorrelationId();
  
  const logData = createLogData(
    logCode,
    message,
    correlationId,
    data
  );
  
  // Log to console (could be extended to log to server/file in production)
  logToConsole(logData);
  
  return { logData, correlationId };
}

// Log code generator helpers
export const generateClientLogCode = (category, action, outcome, severity) => 
  generateLogCode(
    LOG_CODES.ENV.FE,
    LOG_CODES.SERVICE.WEB_APP,
    category,
    action,
    outcome,
    severity
  );

export const generateServerLogCode = (category, action, outcome, severity) => 
  generateLogCode(
    LOG_CODES.ENV.BE,
    LOG_CODES.SERVICE.WEB_APP,
    category,
    action,
    outcome,
    severity
  );
```

#### Server-Side Integration

For server components and API routes:

```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { logger, generateServerLogCode } from '@/lib/logger';
import { LOG_CODES, generateCorrelationId } from 'logme';

export async function GET(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  
  logger(
    generateServerLogCode(
      LOG_CODES.CATEGORY.REQUEST,
      LOG_CODES.ACTION.FETCH,
      LOG_CODES.OUTCOME.STARTED,
      LOG_CODES.SEVERITY.INFO
    ),
    'Fetching users',
    { url: request.url, correlationId }
  );
  
  try {
    const users = await fetchUsers();
    
    logger(
      generateServerLogCode(
        LOG_CODES.CATEGORY.REQUEST,
        LOG_CODES.ACTION.FETCH,
        LOG_CODES.OUTCOME.SUCCESS,
        LOG_CODES.SEVERITY.INFO
      ),
      'Users fetched successfully',
      { count: users.length, correlationId }
    );
    
    return NextResponse.json({ users });
  } catch (error) {
    logger(
      generateServerLogCode(
        LOG_CODES.CATEGORY.REQUEST,
        LOG_CODES.ACTION.FETCH,
        LOG_CODES.OUTCOME.ERROR,
        LOG_CODES.SEVERITY.ERROR
      ),
      'Failed to fetch users',
      { error: error.message, correlationId }
    );
    
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
```

#### Creating a Middleware for Automatic Correlation IDs

Next.js middleware can be used to automatically add correlation IDs:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from 'logme';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Generate a correlation ID if not present
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  
  // Set for the current request flow
  response.headers.set('x-correlation-id', correlationId);
  
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
```

#### Client-Side Integration

For client components and hooks:

```typescript
// components/LoginForm.tsx
'use client';

import { useState } from 'react';
import { logger, generateClientLogCode } from '@/lib/logger';
import { LOG_CODES } from 'logme';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { correlationId } = logger(
      generateClientLogCode(
        LOG_CODES.CATEGORY.AUTH,
        LOG_CODES.ACTION.LOGIN,
        LOG_CODES.OUTCOME.STARTED,
        LOG_CODES.SEVERITY.INFO
      ),
      'User login attempt',
      { email }
    );
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) throw new Error('Login failed');
      
      logger(
        generateClientLogCode(
          LOG_CODES.CATEGORY.AUTH,
          LOG_CODES.ACTION.LOGIN,
          LOG_CODES.OUTCOME.SUCCESS,
          LOG_CODES.SEVERITY.INFO
        ),
        'User login successful',
        { correlationId }
      );
      
      // Handle successful login
    } catch (error) {
      logger(
        generateClientLogCode(
          LOG_CODES.CATEGORY.AUTH,
          LOG_CODES.ACTION.LOGIN,
          LOG_CODES.OUTCOME.ERROR,
          LOG_CODES.SEVERITY.ERROR
        ),
        'User login failed',
        { error: error.message, correlationId }
      );
      
      // Handle login error
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

#### App-Level Setup with Context

For application-wide logging through React Context:

```typescript
// context/LoggingContext.tsx
'use client';

import { createContext, useContext, useEffect } from 'react';
import { logger, generateClientLogCode } from '@/lib/logger';
import { createFetchProxy, LOG_CODES } from 'logme';

const LoggingContext = createContext(null);

export function LoggingProvider({ children }) {
  useEffect(() => {
    // Setup fetch logging on client side only
    if (typeof window !== 'undefined') {
      createFetchProxy({
        logRequestResponse: true,
        logResponseContent: process.env.NODE_ENV !== 'production',
        correlationIdHeader: 'X-Correlation-ID'
      });
      
      // Log page transitions
      const handleRouteChange = (url) => {
        logger(
          generateClientLogCode(
            LOG_CODES.CATEGORY.NAVIGATION,
            LOG_CODES.ACTION.NAVIGATE,
            LOG_CODES.OUTCOME.SUCCESS,
            LOG_CODES.SEVERITY.INFO
          ),
          'Page navigation',
          { url }
        );
      };
      
      window.addEventListener('popstate', () => handleRouteChange(window.location.pathname));
      
      return () => {
        window.removeEventListener('popstate', () => handleRouteChange(window.location.pathname));
      };
    }
  }, []);
  
  return (
    <LoggingContext.Provider value={logger}>
      {children}
    </LoggingContext.Provider>
  );
}

export const useLogger = () => useContext(LoggingContext);
```

And add it to your app layout:

```typescript
// app/layout.tsx
import { LoggingProvider } from '@/context/LoggingContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LoggingProvider>
          {children}
        </LoggingProvider>
      </body>
    </html>
  );
}
```

## Configuration

### FetchLogger Configuration

```typescript
createFetchProxy({
  // Log request and response details
  logRequestResponse: true,
  // Log headers and request body
  logParameters: false,
  // Log response body content
  logResponseContent: false,
  // Log the function that called fetch
  logFunctionName: true
});
```

### ServerLogger Configuration

```typescript
createExpressLogger({
  // Log request body details (sanitized for sensitive info)
  logRequestBody: true,
  // Log response body details
  logResponseBody: true,
  // Include headers in logs
  logHeaders: false,
  // Paths to exclude from logging
  excludePaths: ['/health', '/metrics', '/favicon.ico'],
  // Paths where request body should not be logged
  excludeRequestBody: ['/api/auth/login', '/api/payment'],
  // Paths where response body should not be logged
  excludeResponseBody: ['/api/users/sensitive'],
  // Custom header for correlation ID
  customIDHeader: 'X-Request-ID'
});
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.