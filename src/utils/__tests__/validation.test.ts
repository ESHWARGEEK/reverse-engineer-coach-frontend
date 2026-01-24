/**
 * Comprehensive tests for frontend validation utilities
 */

import {
  InputSanitizer,
  Validators,
  FormValidator,
  SecurityValidator
} from '../validation';

describe('InputSanitizer', () => {
  describe('sanitizeString', () => {
    it('should sanitize HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = InputSanitizer.sanitizeString(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should remove control characters', () => {
      const input = 'Hello\x00\x01World';
      const result = InputSanitizer.sanitizeString(input);
      expect(result).toBe('HelloWorld');
    });

    it('should truncate to max length', () => {
      const input = 'a'.repeat(1000);
      const result = InputSanitizer.sanitizeString(input, 100);
      expect(result.length).toBe(100);
    });
  });

  describe('detectXSS', () => {
    it('should detect script tags', () => {
      expect(InputSanitizer.detectXSS('<script>alert("xss")</script>')).toBe(true);
    });

    it('should detect javascript: URLs', () => {
      expect(InputSanitizer.detectXSS('javascript:alert("xss")')).toBe(true);
    });

    it('should not flag safe content', () => {
      expect(InputSanitizer.detectXSS('This is safe content')).toBe(false);
    });
  });

  describe('detectSQLInjection', () => {
    it('should detect SQL injection attempts', () => {
      expect(InputSanitizer.detectSQLInjection("'; DROP TABLE users; --")).toBe(true);
    });

    it('should not flag safe content', () => {
      expect(InputSanitizer.detectSQLInjection('This is safe content')).toBe(false);
    });
  });
});

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = Validators.validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = Validators.validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
    });
  });
});