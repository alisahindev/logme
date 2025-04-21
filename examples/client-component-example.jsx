'use client';

import { createFetchProxy } from 'logme';
import { useEffect } from 'react';

export default function MyClientComponent() {
  useEffect(() => {
    // Setup the fetch proxy inside useEffect to ensure it's only called after mounting
    // and only on the client side
    const setupLogging = async () => {
      // Option 1: Use the imported function directly (if it's already loaded)
      if (typeof createFetchProxy === 'function') {
        createFetchProxy({
          logFunctionName: true,
          logRequestResponse: true,
          logParameters: true,
          logResponseContent: false,
        });
      } 
      // Option 2: Import the module directly if the function is not loaded
      else {
        try {
          // Dynamic import the entire module
          const logmeModule = await import('logme');
          // Check if createFetchProxy is available
          if (typeof logmeModule.createFetchProxy === 'function') {
            logmeModule.createFetchProxy({
              logFunctionName: true,
              logRequestResponse: true,
              logParameters: true,
              logResponseContent: false,
            });
          } else {
            console.warn('createFetchProxy is not available in the imported module');
          }
        } catch (error) {
          console.error('Error importing logme module:', error);
        }
      }
    };

    setupLogging();
    
    // Your component logic here...
  }, []);

  return (
    <div>
      <h1>Client Component with Fetch Logging</h1>
      <button onClick={() => {
        // This fetch call will be logged
        fetch('https://jsonplaceholder.typicode.com/todos/1')
          .then(response => response.json())
          .then(data => console.log('Fetched data:', data));
      }}>
        Make API Request
      </button>
    </div>
  );
} 