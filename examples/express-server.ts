// Use require syntax for express and body-parser
import { Request, Response } from 'express';
import {
    createDatabaseLogger,
    createExpressLogger,
    expressErrorLogger,
    ServerLoggerConfig
} from '../src/index';

const express = require('express');
const bodyParser = require('body-parser');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON bodies
app.use(bodyParser.json());

// Initialize the logger middleware with custom configuration
const loggerConfig: ServerLoggerConfig = {
  logRequestBody: true,
  logResponseBody: true,
  logHeaders: true,
  excludePaths: ['/health', '/metrics', '/favicon.ico'],
  excludeRequestBody: ['/api/auth/login'],
  excludeResponseBody: ['/api/users/sensitive'],
  customIDHeader: 'X-Request-ID'
};

const logger = createExpressLogger(loggerConfig);

// Create a database logger (example usage)
const dbLogger = createDatabaseLogger('postgres');

// Apply the logger middleware to all routes
app.use(logger);

// Extend Express Request to include our correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

// Example routes
app.get('/api/users', (req: Request, res: Response) => {
  // Example of using correlation ID from the request
  const { correlationId } = req;
  
  // Example of database logging
  dbLogger.logQuery('SELECT * FROM users', [], correlationId);
  
  // Send a response
  res.json({ users: [{ id: 1, name: 'John Doe' }, { id: 2, name: 'Jane Smith' }] });
});

app.post('/api/users', (req: Request, res: Response) => {
  const { name, email } = req.body;
  
  // Validation example that would log details with the same correlation ID
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  // Example database query with parameters
  dbLogger.logQuery(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id', 
    [name, email], 
    req.correlationId
  );
  
  // Respond with created user
  res.status(201).json({ id: 123, name, email });
});

// Example error route
app.get('/api/error', (_req: Request, _res: Response) => {
  // Intentionally throw an error to demonstrate error logging
  throw new Error('This is a test error');
});

// Example route with a database error
app.get('/api/db-error', (req: Request, res: Response) => {
  // Log a simulated database error
  dbLogger.logQueryError(
    'SELECT * FROM nonexistent_table', 
    new Error('relation "nonexistent_table" does not exist'),
    [],
    req.correlationId
  );
  
  res.status(500).json({ error: 'Database error occurred' });
});

// Apply error logger middleware (after routes)
app.use(expressErrorLogger());

// Fallback middleware for 404 errors
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 