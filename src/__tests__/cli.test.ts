import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Path to the compiled CLI script
const CLI_PATH = path.resolve(__dirname, '../../dist/cli.js');

// Helper function to run the CLI with arguments
const runCLI = async (args: string) => {
  try {
    const { stdout, stderr } = await execPromise(`node ${CLI_PATH} ${args}`);
    return { stdout, stderr, exitCode: 0 };
  } catch (error) {
    const e = error as { stdout: string; stderr: string; code: number };
    return { stdout: e.stdout, stderr: e.stderr, exitCode: e.code };
  }
};

describe('CLI', () => {
  // Skip these tests during automated CI runs where the CLI might not be compiled yet
  const testOrSkip = process.env.CI ? describe.skip : describe;
  
  testOrSkip('decode command', () => {
    it('should decode a valid log code', async () => {
      const { stdout, exitCode } = await runCLI('decode BE.1003.01.01.01.I');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Decoding Log Code');
      expect(stdout).toContain('BE');
      expect(stdout).toContain('1003');
      expect(stdout).toContain('AUTH');
      expect(stdout).toContain('Backend');
    });
    
    it('should report an error for invalid log codes', async () => {
      const { stderr, exitCode } = await runCLI('decode INVALID');
      
      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('Invalid log code format');
    });
  });
  
  testOrSkip('list command', () => {
    it('should list all code segments when no specific segment is provided', async () => {
      const { stdout, exitCode } = await runCLI('list');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('All Available Log Code Segments');
      expect(stdout).toContain('Environments');
      expect(stdout).toContain('Services');
      expect(stdout).toContain('Categories');
      expect(stdout).toContain('Actions');
      expect(stdout).toContain('Outcomes');
      expect(stdout).toContain('Severities');
    });
    
    it('should list specific segment details when provided', async () => {
      const { stdout, exitCode } = await runCLI('list env');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Available Env Codes');
      expect(stdout).toContain('FE');
      expect(stdout).toContain('BE');
    });
  });
  
  testOrSkip('build command', () => {
    it('should build a valid log code with provided segments', async () => {
      const { stdout, exitCode } = await runCLI('build BE 1003 01 01 01 I');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Generated Log Code');
      expect(stdout).toContain('BE.1003.01.01.01.I');
    });
    
    it('should report an error for invalid segment values', async () => {
      const { stderr, exitCode } = await runCLI('build XX 1003 01 01 01 I');
      
      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('Invalid segment values');
    });
  });
  
  testOrSkip('generate command', () => {
    it('should display available options for generating a log code', async () => {
      const { stdout, exitCode } = await runCLI('generate');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Available Environment Codes');
      expect(stdout).toContain('Available Service Codes');
      expect(stdout).toContain('Available Category Codes');
      expect(stdout).toContain('Available Action Codes');
      expect(stdout).toContain('Available Outcome Codes');
      expect(stdout).toContain('Available Severity Codes');
    });
  });
}); 