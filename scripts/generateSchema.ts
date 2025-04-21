import * as fs from 'fs';
import * as path from 'path';
import { LOG_CODES } from '../src/enums/LogCodes';

/**
 * Generates a log-codes.json file containing all the code definitions
 * This allows other tools and languages to use the same code definitions
 */
function generateSchema() {
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Log Codes Schema",
    description: "Schema for standardized logging codes",
    type: "object",
    properties: {
      envs: {
        type: "object",
        description: "Environment codes",
        additionalProperties: {
          type: "object",
          properties: {
            code: { type: "string" },
            description: { type: "string" }
          },
          required: ["code", "description"]
        }
      },
      services: {
        type: "object",
        description: "Service codes",
        additionalProperties: {
          type: "object",
          properties: {
            code: { type: "string" },
            description: { type: "string" }
          },
          required: ["code", "description"]
        }
      },
      categories: {
        type: "object",
        description: "Category codes",
        additionalProperties: {
          type: "object",
          properties: {
            code: { type: "string" },
            description: { type: "string" }
          },
          required: ["code", "description"]
        }
      },
      actions: {
        type: "object",
        description: "Action codes",
        additionalProperties: {
          type: "object",
          properties: {
            code: { type: "string" },
            description: { type: "string" }
          },
          required: ["code", "description"]
        }
      },
      outcomes: {
        type: "object",
        description: "Outcome codes",
        additionalProperties: {
          type: "object",
          properties: {
            code: { type: "string" },
            description: { type: "string" }
          },
          required: ["code", "description"]
        }
      },
      severities: {
        type: "object",
        description: "Severity codes",
        additionalProperties: {
          type: "object",
          properties: {
            code: { type: "string" },
            description: { type: "string" }
          },
          required: ["code", "description"]
        }
      }
    },
    required: ["envs", "services", "categories", "actions", "outcomes", "severities"]
  };

  // Build the actual data object based on LOG_CODES
  const data = {
    envs: Object.entries(LOG_CODES.ENV).reduce((acc, [key, code]) => {
      acc[key] = {
        code,
        description: key === 'FE' ? 'Frontend' : 'Backend'
      };
      return acc;
    }, {} as Record<string, { code: string; description: string }>),
    
    services: Object.entries(LOG_CODES.SERVICE).reduce((acc, [key, code]) => {
      acc[key] = {
        code, 
        description: `${key.charAt(0)}${key.slice(1).toLowerCase()} Service`
      };
      return acc;
    }, {} as Record<string, { code: string; description: string }>),
    
    categories: {
      REQUEST: {
        code: LOG_CODES.CATEGORY.REQUEST,
        description: 'HTTP Request'
      },
      RESPONSE: {
        code: LOG_CODES.CATEGORY.RESPONSE,
        description: 'HTTP Response'
      }
    },
    
    actions: {
      SEND: {
        code: LOG_CODES.ACTION.SEND,
        description: 'Send HTTP request'
      },
      RECEIVE: {
        code: LOG_CODES.ACTION.RECEIVE,
        description: 'Receive HTTP response'
      },
      ERROR: {
        code: LOG_CODES.ACTION.ERROR,
        description: 'Error in HTTP communication'
      }
    },
    
    outcomes: {
      SUCCESS: {
        code: LOG_CODES.OUTCOME.SUCCESS,
        description: 'Successful operation'
      },
      FAILURE: {
        code: LOG_CODES.OUTCOME.FAILURE,
        description: 'Failed operation'
      },
      INVALID: {
        code: LOG_CODES.OUTCOME.INVALID,
        description: 'Invalid operation'
      },
      TIMEOUT: {
        code: LOG_CODES.OUTCOME.TIMEOUT,
        description: 'Operation timed out'
      }
    },
    
    severities: {
      INFO: {
        code: LOG_CODES.SEVERITY.INFO,
        description: 'Informational'
      },
      WARN: {
        code: LOG_CODES.SEVERITY.WARN,
        description: 'Warning'
      },
      ERROR: {
        code: LOG_CODES.SEVERITY.ERROR,
        description: 'Error'
      },
      DEBUG: {
        code: LOG_CODES.SEVERITY.DEBUG,
        description: 'Debug'
      }
    }
  };

  // Create the output directory if it doesn't exist
  const outputDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the schema file
  fs.writeFileSync(
    path.join(outputDir, 'log-codes.schema.json'),
    JSON.stringify(schema, null, 2)
  );

  // Write the data file
  fs.writeFileSync(
    path.join(outputDir, 'log-codes.json'),
    JSON.stringify(data, null, 2)
  );

  console.log('Schema and data files generated successfully!');
}

// Execute when run directly
if (require.main === module) {
  generateSchema();
}

export default generateSchema; 