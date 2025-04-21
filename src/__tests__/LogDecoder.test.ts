import { decodeLogCode, getLogCodeDescription } from '../utils/LogDecoder';

describe('LogDecoder', () => {
  describe('decodeLogCode', () => {
    it('should decode a valid log code', () => {
      const decoded = decodeLogCode('BE.1003.01.01.01.I');
      
      expect(decoded).toMatchObject({
        code: 'BE.1003.01.01.01.I',
        env: { code: 'BE', key: 'BE', description: 'Backend' },
        service: { code: '1003', key: 'AUTH', description: 'Auth Service' },
        category: { code: '01', key: 'REQUEST', description: 'HTTP Request' },
        action: { code: '01', key: 'SEND', description: 'Send HTTP request' },
        outcome: { code: '01', key: 'SUCCESS', description: 'Successful operation' },
        severity: { code: 'I', key: 'INFO', description: 'Informational' }
      });
    });
    
    it('should return null for invalid log codes', () => {
      expect(decodeLogCode('invalid')).toBeNull();
      expect(decodeLogCode('BE.1003')).toBeNull();
    });
    
    it('should handle unknown codes with fallback descriptions', () => {
      // Use a valid format but with non-existent codes
      const decoded = decodeLogCode('BE.9999.99.99.99.I');
      
      expect(decoded).toMatchObject({
        code: 'BE.9999.99.99.99.I',
        env: { code: 'BE', description: 'Backend' },
        service: { code: '9999', description: 'Unknown Service' },
        category: { code: '99', description: 'Unknown Category' },
        action: { code: '99', description: 'Unknown Action' },
        outcome: { code: '99', description: 'Unknown Outcome' },
        severity: { code: 'I', key: 'INFO', description: 'Informational' }
      });
    });
  });
  
  describe('getLogCodeDescription', () => {
    it('should return a human-readable description', () => {
      const description = getLogCodeDescription('BE.1003.01.01.01.I');
      
      expect(description).toBe('Backend Auth Service - Send HTTP request HTTP Request - Successful operation (Informational)');
    });
    
    it('should return an error message for invalid log codes', () => {
      expect(getLogCodeDescription('invalid')).toBe('Invalid log code format');
    });
  });
}); 