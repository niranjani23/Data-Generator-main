import { describe, it, expect } from 'vitest';

// Validation utilities
const validators = {
  isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  },

  isValidPrompt(prompt: string): boolean {
    return prompt.trim().length > 0 && prompt.length <= 5000;
  },

  isValidFormat(format: string): boolean {
    const validFormats = ['JSON', 'CSV', 'XML', 'TXT'];
    return validFormats.includes(format.toUpperCase());
  },

  isValidDateFormat(format: string): boolean {
    const validDateFormats = [
      'ISO 8601',
      'YYYY-MM-DD',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'Unix Timestamp',
      'Custom',
    ];
    return validDateFormats.includes(format);
  },

  isValidDecimalPrecision(precision: number): boolean {
    return Number.isInteger(precision) && precision >= 0 && precision <= 10;
  },

  hasRequiredFields(data: any, fields: string[]): boolean {
    if (!data || typeof data !== 'object') return false;
    return fields.every(field => field in data);
  },

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidDataStructure(data: string, format: string): boolean {
    try {
      switch (format.toUpperCase()) {
        case 'JSON':
          JSON.parse(data);
          return true;
        case 'CSV':
          return data.split('\n').length > 0;
        case 'XML':
          return data.includes('<') && data.includes('>');
        case 'TXT':
          return typeof data === 'string';
        default:
          return false;
      }
    } catch {
      return false;
    }
  },

  sanitizeInput(input: string): string {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  },
};

describe('Validator Utilities', () => {
  describe('isValidJson', () => {
    it('should validate correct JSON', () => {
      expect(validators.isValidJson('{}')).toBe(true);
      expect(validators.isValidJson('[]')).toBe(true);
      expect(validators.isValidJson('{"name":"John"}')).toBe(true);
      expect(validators.isValidJson('[1,2,3]')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(validators.isValidJson('not json')).toBe(false);
      expect(validators.isValidJson('{name:"John"}')).toBe(false);
      expect(validators.isValidJson('{"name":}')).toBe(false);
      expect(validators.isValidJson('')).toBe(false);
    });

    it('should handle complex nested JSON', () => {
      const complex = JSON.stringify({
        users: [{ name: 'John', age: 30 }],
        meta: { count: 1 },
      });
      expect(validators.isValidJson(complex)).toBe(true);
    });

    it('should handle JSON with special characters', () => {
      expect(validators.isValidJson('{"text":"Hello\nWorld"}')).toBe(true);
      expect(validators.isValidJson('{"emoji":"😀"}')).toBe(true);
    });
  });

  describe('isValidPrompt', () => {
    it('should validate non-empty prompts', () => {
      expect(validators.isValidPrompt('Generate 5 users')).toBe(true);
      expect(validators.isValidPrompt('a')).toBe(true);
    });

    it('should reject empty or whitespace prompts', () => {
      expect(validators.isValidPrompt('')).toBe(false);
      expect(validators.isValidPrompt('   ')).toBe(false);
      expect(validators.isValidPrompt('\n\t')).toBe(false);
    });

    it('should reject very long prompts', () => {
      const tooLong = 'a'.repeat(5001);
      expect(validators.isValidPrompt(tooLong)).toBe(false);
    });

    it('should accept prompts at the limit', () => {
      const atLimit = 'a'.repeat(5000);
      expect(validators.isValidPrompt(atLimit)).toBe(true);
    });

    it('should handle prompts with special characters', () => {
      expect(validators.isValidPrompt('Users with "quotes" & symbols')).toBe(true);
      expect(validators.isValidPrompt('Users\nwith\nnewlines')).toBe(true);
    });
  });

  describe('isValidFormat', () => {
    it('should validate supported formats', () => {
      expect(validators.isValidFormat('JSON')).toBe(true);
      expect(validators.isValidFormat('CSV')).toBe(true);
      expect(validators.isValidFormat('XML')).toBe(true);
      expect(validators.isValidFormat('TXT')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(validators.isValidFormat('json')).toBe(true);
      expect(validators.isValidFormat('csv')).toBe(true);
      expect(validators.isValidFormat('Xml')).toBe(true);
      expect(validators.isValidFormat('tXt')).toBe(true);
    });

    it('should reject unsupported formats', () => {
      expect(validators.isValidFormat('PDF')).toBe(false);
      expect(validators.isValidFormat('YAML')).toBe(false);
      expect(validators.isValidFormat('')).toBe(false);
      expect(validators.isValidFormat('INVALID')).toBe(false);
    });
  });

  describe('isValidDateFormat', () => {
    it('should validate supported date formats', () => {
      expect(validators.isValidDateFormat('ISO 8601')).toBe(true);
      expect(validators.isValidDateFormat('YYYY-MM-DD')).toBe(true);
      expect(validators.isValidDateFormat('MM/DD/YYYY')).toBe(true);
      expect(validators.isValidDateFormat('DD/MM/YYYY')).toBe(true);
      expect(validators.isValidDateFormat('Unix Timestamp')).toBe(true);
      expect(validators.isValidDateFormat('Custom')).toBe(true);
    });

    it('should reject unsupported date formats', () => {
      expect(validators.isValidDateFormat('INVALID')).toBe(false);
      expect(validators.isValidDateFormat('')).toBe(false);
      expect(validators.isValidDateFormat('DD-MM-YYYY')).toBe(false);
    });

    it('should be case-sensitive for date formats', () => {
      expect(validators.isValidDateFormat('iso 8601')).toBe(false);
      expect(validators.isValidDateFormat('yyyy-mm-dd')).toBe(false);
    });
  });

  describe('isValidDecimalPrecision', () => {
    it('should validate valid precision values', () => {
      expect(validators.isValidDecimalPrecision(0)).toBe(true);
      expect(validators.isValidDecimalPrecision(2)).toBe(true);
      expect(validators.isValidDecimalPrecision(5)).toBe(true);
      expect(validators.isValidDecimalPrecision(10)).toBe(true);
    });

    it('should reject negative precision', () => {
      expect(validators.isValidDecimalPrecision(-1)).toBe(false);
      expect(validators.isValidDecimalPrecision(-5)).toBe(false);
    });

    it('should reject precision above limit', () => {
      expect(validators.isValidDecimalPrecision(11)).toBe(false);
      expect(validators.isValidDecimalPrecision(100)).toBe(false);
    });

    it('should reject non-integer precision', () => {
      expect(validators.isValidDecimalPrecision(2.5)).toBe(false);
      expect(validators.isValidDecimalPrecision(3.14)).toBe(false);
    });

    it('should reject NaN', () => {
      expect(validators.isValidDecimalPrecision(NaN)).toBe(false);
    });
  });

  describe('hasRequiredFields', () => {
    it('should validate objects with all required fields', () => {
      const data = { name: 'John', age: 30, email: 'john@example.com' };
      expect(validators.hasRequiredFields(data, ['name', 'age'])).toBe(true);
      expect(validators.hasRequiredFields(data, ['email'])).toBe(true);
    });

    it('should reject objects missing required fields', () => {
      const data = { name: 'John', age: 30 };
      expect(validators.hasRequiredFields(data, ['email'])).toBe(false);
      expect(validators.hasRequiredFields(data, ['name', 'email'])).toBe(false);
    });

    it('should handle empty field list', () => {
      const data = { name: 'John' };
      expect(validators.hasRequiredFields(data, [])).toBe(true);
    });

    it('should reject non-objects', () => {
      expect(validators.hasRequiredFields(null, ['name'])).toBe(false);
      expect(validators.hasRequiredFields(undefined, ['name'])).toBe(false);
      expect(validators.hasRequiredFields('string', ['name'])).toBe(false);
      expect(validators.hasRequiredFields(123, ['name'])).toBe(false);
    });

    it('should handle nested field checks', () => {
      const data = { user: { name: 'John' } };
      expect(validators.hasRequiredFields(data, ['user'])).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validators.isValidEmail('user@example.com')).toBe(true);
      expect(validators.isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(validators.isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validators.isValidEmail('not-an-email')).toBe(false);
      expect(validators.isValidEmail('@example.com')).toBe(false);
      expect(validators.isValidEmail('user@')).toBe(false);
      expect(validators.isValidEmail('user @example.com')).toBe(false);
      expect(validators.isValidEmail('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validators.isValidEmail('a@b.c')).toBe(true);
      expect(validators.isValidEmail('test@localhost')).toBe(true);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(validators.isValidUrl('https://example.com')).toBe(true);
      expect(validators.isValidUrl('http://localhost:3000')).toBe(true);
      expect(validators.isValidUrl('https://sub.domain.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validators.isValidUrl('not a url')).toBe(false);
      expect(validators.isValidUrl('example.com')).toBe(false);
      expect(validators.isValidUrl('')).toBe(false);
    });

    it('should handle various protocols', () => {
      expect(validators.isValidUrl('ftp://example.com')).toBe(true);
      expect(validators.isValidUrl('file:///path/to/file')).toBe(true);
    });
  });

  describe('isValidDataStructure', () => {
    it('should validate JSON structure', () => {
      expect(validators.isValidDataStructure('{}', 'JSON')).toBe(true);
      expect(validators.isValidDataStructure('[]', 'JSON')).toBe(true);
      expect(validators.isValidDataStructure('invalid', 'JSON')).toBe(false);
    });

    it('should validate CSV structure', () => {
      expect(validators.isValidDataStructure('a,b,c\n1,2,3', 'CSV')).toBe(true);
      expect(validators.isValidDataStructure('single line', 'CSV')).toBe(true);
    });

    it('should validate XML structure', () => {
      expect(validators.isValidDataStructure('<root></root>', 'XML')).toBe(true);
      expect(validators.isValidDataStructure('no tags', 'XML')).toBe(false);
    });

    it('should validate TXT structure', () => {
      expect(validators.isValidDataStructure('any text', 'TXT')).toBe(true);
      expect(validators.isValidDataStructure('', 'TXT')).toBe(true);
    });

    it('should handle case-insensitive formats', () => {
      expect(validators.isValidDataStructure('{}', 'json')).toBe(true);
      expect(validators.isValidDataStructure('<a/>', 'xml')).toBe(true);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const sanitized = validators.sanitizeInput(input);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toBe('Hello');
    });

    it('should remove HTML tags', () => {
      const input = '<div>Hello</div><p>World</p>';
      const sanitized = validators.sanitizeInput(input);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).toBe('HelloWorld');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const sanitized = validators.sanitizeInput(input);
      
      expect(sanitized).toBe('Hello World');
    });

    it('should preserve safe text', () => {
      const input = 'Hello World 123';
      const sanitized = validators.sanitizeInput(input);
      
      expect(sanitized).toBe('Hello World 123');
    });

    it('should handle multiple script tags', () => {
      const input = '<script>bad</script>Good<script>bad2</script>';
      const sanitized = validators.sanitizeInput(input);
      
      expect(sanitized).toBe('Good');
    });

    it('should handle empty string', () => {
      expect(validators.sanitizeInput('')).toBe('');
    });

    it('should handle special characters', () => {
      const input = 'Hello & "World" \'test\'';
      const sanitized = validators.sanitizeInput(input);
      
      expect(sanitized).toContain('&');
      expect(sanitized).toContain('"');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined gracefully', () => {
      expect(validators.isValidJson(null as any)).toBe(false);
      expect(validators.isValidPrompt(null as any)).toBe(false);
    });

    it('should handle very long strings efficiently', () => {
      const longString = 'a'.repeat(10000);
      expect(() => validators.isValidJson(longString)).not.toThrow();
      expect(() => validators.sanitizeInput(longString)).not.toThrow();
    });

    it('should handle unicode characters', () => {
      expect(validators.isValidPrompt('日本語テスト')).toBe(true);
      expect(validators.sanitizeInput('Hello 😀')).toContain('😀');
    });

    it('should handle numbers as strings', () => {
      expect(validators.isValidJson('123')).toBe(true);
      expect(validators.isValidJson('3.14')).toBe(true);
    });
  });
});
