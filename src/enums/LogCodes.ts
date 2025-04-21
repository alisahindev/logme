// Log Code Constants as per standardization
export const LOG_CODES = {
  ENV: {
    FE: 'FE', // Frontend
    BE: 'BE', // Backend
  },
  SERVICE: {
    FETCH: '1001', // HTTP Fetch service code
    API: '1002', // API service code
    AUTH: '1003', // Authentication service code
    USER: '1004', // User service code
    PRODUCT: '1005', // Product service code
    ORDER: '1006', // Order service code
    PAYMENT: '1007', // Payment service code
    NOTIFICATION: '1008', // Notification service code
    CART: '1009', // Cart service code
    SHIPPING: '1010', // Shipping service code
    INVENTORY: '1011', // Inventory service code
  },
  CATEGORY: {
    REQUEST: '01',  // HTTP Request category
    RESPONSE: '02', // HTTP Response category
  },
  ACTION: {
    SEND: '01',     // Send HTTP request
    RECEIVE: '02',  // Receive HTTP response
    ERROR: '03',    // Error in HTTP communication
  },
  OUTCOME: {
    SUCCESS: '01',  // Successful operation
    FAILURE: '02',  // Failed operation
    INVALID: '03',  // Invalid operation (e.g., bad parameters)
    TIMEOUT: '04',  // Operation timed out
  },
  SEVERITY: {
    INFO: 'I',      // Informational
    WARN: 'W',      // Warning
    ERROR: 'E',     // Error
    DEBUG: 'D',     // Debug
  }
} as const; 