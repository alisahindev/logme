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