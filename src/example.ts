import { createFetchProxy } from './index';

/**
 * Example usage of the fetch logger
 */

// Initialize the fetch logger with all logging options enabled
createFetchProxy({
  logFunctionName: true,
  logRequestResponse: true,
  logParameters: true,
  logResponseContent: true
});

// Custom log display for the example
class LogDisplay {
  private logContainer: HTMLDivElement;
  
  constructor() {
    // Override console.log to capture logs
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      this.displayLog(args[0], 'info');
    };
    
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      this.displayLog(args[0], 'error');
    };
    
    // Create log container
    this.logContainer = document.createElement('div');
    this.logContainer.id = 'log-container';
    this.logContainer.style.cssText = 'width: 100%; max-height: 500px; overflow-y: auto; background: #f3f3f3; padding: 10px; border-radius: 5px; font-family: monospace; margin-top: 20px;';
    
    // Create clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear Logs';
    clearButton.style.cssText = 'margin: 10px 0; padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;';
    clearButton.onclick = () => this.clearLogs();
    
    // Append to body
    document.body.appendChild(clearButton);
    document.body.appendChild(this.logContainer);
  }
  
  displayLog(logData: string, type: 'info' | 'error') {
    try {
      // Parse the JSON log
      const logObj = typeof logData === 'string' ? JSON.parse(logData) : logData;
      
      // Create log entry element
      const logEntry = document.createElement('div');
      logEntry.className = `log-entry ${type} ${logObj.level || ''}`;
      logEntry.style.cssText = 'margin-bottom: 10px; padding: 8px; border-radius: 4px; border-left: 4px solid #3498db;';
      
      if (type === 'error' || logObj.level === 'error') {
        logEntry.style.borderLeftColor = '#e74c3c';
        logEntry.style.backgroundColor = '#fadbd8';
      } else if (logObj.level === 'warn') {
        logEntry.style.borderLeftColor = '#f39c12';
        logEntry.style.backgroundColor = '#fef9e7';
      } else if (logObj.level === 'debug') {
        logEntry.style.borderLeftColor = '#9b59b6';
        logEntry.style.backgroundColor = '#f5eef8';
      }
      
      // Create header with timestamp and code
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold;';
      
      const timestamp = document.createElement('span');
      timestamp.textContent = logObj.timestamp || new Date().toISOString();
      timestamp.style.cssText = 'color: #555;';
      
      const code = document.createElement('span');
      code.textContent = logObj.code || '';
      code.style.cssText = 'color: #3498db; cursor: pointer;';
      code.title = 'Click to see code details';
      code.onclick = () => this.showCodeDetails(logObj.code);
      
      header.appendChild(timestamp);
      header.appendChild(code);
      logEntry.appendChild(header);
      
      // Add message
      const message = document.createElement('div');
      message.textContent = logObj.message || '';
      message.style.cssText = 'margin-bottom: 5px; font-weight: bold;';
      logEntry.appendChild(message);
      
      // Add data as expandable JSON
      if (logObj.data) {
        const dataContainer = document.createElement('div');
        dataContainer.style.cssText = 'background: rgba(255,255,255,0.7); padding: 5px; border-radius: 3px; overflow: auto; max-height: 150px;';
        
        const dataContent = document.createElement('pre');
        dataContent.style.cssText = 'margin: 0; font-size: 12px;';
        dataContent.textContent = JSON.stringify(logObj.data, null, 2);
        
        dataContainer.appendChild(dataContent);
        logEntry.appendChild(dataContainer);
      }
      
      // Add to container at the top
      this.logContainer.insertBefore(logEntry, this.logContainer.firstChild);
    } catch (e) {
      // Not a parsable JSON log, display as text
      const logEntry = document.createElement('div');
      logEntry.className = `log-entry ${type}`;
      logEntry.style.cssText = 'margin-bottom: 10px; padding: 8px; border-radius: 4px; border-left: 4px solid #7f8c8d;';
      logEntry.textContent = typeof logData === 'string' ? logData : JSON.stringify(logData);
      this.logContainer.insertBefore(logEntry, this.logContainer.firstChild);
    }
  }
  
  showCodeDetails(code: string) {
    if (!code) return;
    
    const parts = code.split('.');
    if (parts.length !== 6) return;
    
    const [env, service, category, action, outcome, severity] = parts;
    
    alert(`Code Details:
- Environment: ${env}
- Service: ${service}
- Category: ${category}
- Action: ${action}
- Outcome: ${outcome}
- Severity: ${severity}`);
  }
  
  clearLogs() {
    this.logContainer.innerHTML = '';
  }
}

// Example API endpoints
const ENDPOINTS = {
  GET_USERS: 'https://jsonplaceholder.typicode.com/users',
  GET_POSTS: 'https://jsonplaceholder.typicode.com/posts',
  POST_USER: 'https://jsonplaceholder.typicode.com/users',
  GET_NOT_FOUND: 'https://jsonplaceholder.typicode.com/nonexistent',
};

// API functions
async function getUsers() {
  return fetch(ENDPOINTS.GET_USERS);
}

async function getPosts() {
  return fetch(ENDPOINTS.GET_POSTS);
}

async function createUser(userData: any) {
  return fetch(ENDPOINTS.POST_USER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
}

async function triggerError() {
  return fetch(ENDPOINTS.GET_NOT_FOUND);
}

// Create UI for the example
function createExampleUI() {
  const container = document.createElement('div');
  container.style.cssText = 'max-width: 800px; margin: 20px auto; font-family: Arial, sans-serif;';
  
  // Title
  const title = document.createElement('h1');
  title.textContent = 'Fetch Logger Example';
  container.appendChild(title);
  
  // Description
  const description = document.createElement('p');
  description.textContent = 'This example demonstrates the fetch logger in action. Click the buttons below to make different types of API requests and see the logs.';
  container.appendChild(description);
  
  // Buttons container
  const buttons = document.createElement('div');
  buttons.style.cssText = 'display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;';
  
  // GET Users button
  const getUsersBtn = document.createElement('button');
  getUsersBtn.textContent = 'GET Users';
  getUsersBtn.style.cssText = 'padding: 10px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;';
  getUsersBtn.onclick = async () => {
    try {
      const response = await getUsers();
      const data = await response.json();
      console.log(`Received ${data.length} users`);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  buttons.appendChild(getUsersBtn);
  
  // GET Posts button
  const getPostsBtn = document.createElement('button');
  getPostsBtn.textContent = 'GET Posts';
  getPostsBtn.style.cssText = 'padding: 10px 15px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer;';
  getPostsBtn.onclick = async () => {
    try {
      const response = await getPosts();
      const data = await response.json();
      console.log(`Received ${data.length} posts`);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };
  buttons.appendChild(getPostsBtn);
  
  // POST User button
  const postUserBtn = document.createElement('button');
  postUserBtn.textContent = 'POST User';
  postUserBtn.style.cssText = 'padding: 10px 15px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer;';
  postUserBtn.onclick = async () => {
    const newUser = {
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser'
    };
    
    try {
      const response = await createUser(newUser);
      const data = await response.json();
      console.log(`Created user with ID: ${data.id}`);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };
  buttons.appendChild(postUserBtn);
  
  // Error button
  const errorBtn = document.createElement('button');
  errorBtn.textContent = 'Trigger Error';
  errorBtn.style.cssText = 'padding: 10px 15px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;';
  errorBtn.onclick = async () => {
    try {
      await triggerError();
    } catch (error) {
      console.error('Expected error occurred');
    }
  };
  buttons.appendChild(errorBtn);
  
  container.appendChild(buttons);
  document.body.appendChild(container);
}

// Initialize the example when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LogDisplay();
  createExampleUI();
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    code: 'FE.1001.01.01.01.I',
    message: 'Fetch Logger Example initialized',
    level: 'info',
    data: { initialized: true }
  }));
}); 