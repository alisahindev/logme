// Use CommonJS require syntax for better compatibility with TypeScript settings
import { NextFunction, Request, Response } from 'express';
import { createDatabaseLogger, createExpressLogger, expressErrorLogger } from '../../src/index';

const express = require('express');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up layout
app.use(ejsLayouts);
app.set('layout', 'layout');

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Type extension for Express Request
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

// Integrate logme express logger
app.use(createExpressLogger({
  logRequestBody: true,
  logResponseBody: true,
  excludePaths: ['/health', '/favicon.ico', '/public'],
  customIDHeader: 'X-Request-ID'
}));

// Create a mock database logger
const dbLogger = createDatabaseLogger('postgres');

// Mock database functions
const mockDb = {
  getUsers: () => {
    return [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];
  },
  getUserById: (id: number) => {
    const users = mockDb.getUsers();
    return users.find(user => user.id === id);
  }
};

// Routes
app.get('/', (req: Request, res: Response) => {
  // Log the request with correlation ID
  dbLogger.logQuery('SELECT * FROM page_views', [], req.correlationId);
  
  // Render home page
  res.render('home', { 
    title: 'SSR Example with LogMe',
    message: 'Welcome to the SSR Example'
  });
});

app.get('/users', (req: Request, res: Response) => {
  // Log database query
  dbLogger.logQuery('SELECT * FROM users', [], req.correlationId);
  
  // Get users from mock database
  const users = mockDb.getUsers();
  
  // Render users page
  res.render('users', { 
    title: 'Users List',
    users
  });
});

app.get('/users/:id', (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  
  // Log database query with parameters
  dbLogger.logQuery(
    'SELECT * FROM users WHERE id = $1',
    [userId],
    req.correlationId
  );
  
  // Get user from mock database
  const user = mockDb.getUserById(userId);
  
  if (!user) {
    // Trigger 404 error to test error logging
    return res.status(404).render('error', {
      title: 'User Not Found',
      message: `User with ID ${userId} not found`
    });
  }
  
  // Render user detail page
  res.render('user-detail', { 
    title: `User: ${user.name}`,
    user
  });
});

// Error route for testing error logging
app.get('/error', (_req: Request, _res: Response) => {
  // Intentionally throw an error
  throw new Error('This is a test error from the SSR application');
});

// Add error logger middleware - this will log errors
app.use(expressErrorLogger());

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'An unexpected error occurred'
  });
  // Call next to pass the error to any remaining middleware
  next();
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: `The page ${req.path} does not exist`
  });
});

// Start the server
app.listen(port, () => {
  console.log(`SSR example app running at http://localhost:${port}`);
}); 