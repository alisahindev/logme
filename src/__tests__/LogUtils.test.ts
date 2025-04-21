import { LOG_CODES } from '../enums/LogCodes';
import { LogCode } from '../types/LogTypes';
import {
    createLogData,
    generateCorrelationId,
    generateLogCode,
    isValidLogCode,
    mapSeverityToLogLevel,
    parseLogCode,
} from '../utils/LogUtils';

describe('LogUtils', () => {
  describe('generateLogCode', () => {
    it('should generate a valid log code', () => {
      const logCode = generateLogCode(
        LOG_CODES.ENV.BE,
        LOG_CODES.SERVICE.AUTH,
        LOG_CODES.CATEGORY.REQUEST,
        LOG_CODES.ACTION.SEND,
        LOG_CODES.OUTCOME.SUCCESS,
        LOG_CODES.SEVERITY.INFO
      );
      
      expect(logCode).toBe('BE.1003.01.01.01.I');
    });
  });
  
  describe('isValidLogCode', () => {
    it('should return true for valid log codes', () => {
      expect(isValidLogCode('BE.1003.01.01.01.I')).toBe(true);
      expect(isValidLogCode('FE.1001.02.02.02.W')).toBe(true);
      expect(isValidLogCode('BE.1005.01.03.01.E')).toBe(true);
      expect(isValidLogCode('FE.1002.02.02.04.D')).toBe(true);
    });
    
    it('should return false for invalid log codes', () => {
      expect(isValidLogCode('BE.1003.01.01.01')).toBe(false); // Missing severity
      expect(isValidLogCode('FE.1001.02.02.W')).toBe(false); // Missing outcome
      expect(isValidLogCode('X.1003.01.01.01.I')).toBe(false); // Invalid ENV
      expect(isValidLogCode('BE.103.01.01.01.I')).toBe(false); // SERVICE should be 4 digits
      expect(isValidLogCode('BE.1003.1.01.01.I')).toBe(false); // CATEGORY should be 2 digits
      expect(isValidLogCode('BE.1003.01.1.01.I')).toBe(false); // ACTION should be 2 digits
      expect(isValidLogCode('BE.1003.01.01.1.I')).toBe(false); // OUTCOME should be 2 digits
      expect(isValidLogCode('BE.1003.01.01.01.X')).toBe(false); // Invalid SEVERITY
      expect(isValidLogCode('')).toBe(false); // Empty string
      expect(isValidLogCode('random string')).toBe(false); // Random string
    });
  });
  
  describe('parseLogCode', () => {
    it('should correctly parse a valid log code', () => {
      const parsed = parseLogCode('BE.1003.01.01.01.I');
      
      expect(parsed).toEqual({
        env: 'BE',
        service: '1003',
        category: '01',
        action: '01',
        outcome: '01',
        severity: 'I'
      });
    });
    
    it('should return null for invalid log codes', () => {
      expect(parseLogCode('invalid')).toBeNull();
      expect(parseLogCode('BE.1003')).toBeNull();
    });
  });
  
  describe('mapSeverityToLogLevel', () => {
    it('should map severity codes to log levels', () => {
      expect(mapSeverityToLogLevel(LOG_CODES.SEVERITY.INFO)).toBe('info');
      expect(mapSeverityToLogLevel(LOG_CODES.SEVERITY.WARN)).toBe('warn');
      expect(mapSeverityToLogLevel(LOG_CODES.SEVERITY.ERROR)).toBe('error');
      expect(mapSeverityToLogLevel(LOG_CODES.SEVERITY.DEBUG)).toBe('debug');
    });
  });
  
  describe('generateCorrelationId', () => {
    it('should generate a correlation ID with the right format', () => {
      const correlationId = generateCorrelationId('test');
      
      expect(correlationId).toMatch(/^test-\d+-[a-z0-9]{8}$/);
    });
    
    it('should use the default prefix if none is provided', () => {
      const correlationId = generateCorrelationId();
      
      expect(correlationId).toMatch(/^log-\d+-[a-z0-9]{8}$/);
    });
  });
  
  describe('createLogData', () => {
    it('should create a log data object with the correct structure', () => {
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-01-01T12:00:00.000Z');
      
      const logCode = 'BE.1003.01.01.01.I' as LogCode;
      const logData = createLogData(
        logCode,
        'Test message',
        'correlation-123',
        { testData: 'value' }
      );
      
      expect(logData).toEqual({
        timestamp: '2023-01-01T12:00:00.000Z',
        code: logCode,
        message: 'Test message',
        level: 'info',
        correlationId: 'correlation-123',
        data: { testData: 'value' }
      });
    });
    
    it('should throw an error for invalid log codes', () => {
      expect(() => {
        createLogData(
          'invalid' as LogCode,
          'Test message',
          'correlation-123'
        );
      }).toThrow();
    });
  });
}); 