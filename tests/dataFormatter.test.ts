import { describe, it, expect } from 'vitest';
import { mockGeneratedData } from '../../setup/testUtils';

// Data formatter service implementation
class DataFormatter {
  jsonToCsv(jsonString: string): string {
    const data = JSON.parse(jsonString);
    const array = Array.isArray(data) ? data : [data];
    
    if (array.length === 0) return '';
    
    const headers = Object.keys(array[0]);
    const rows = array.map(obj => 
      headers.map(header => {
        const value = obj[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }

  jsonToXml(jsonString: string): string {
    const data = JSON.parse(jsonString);
    const array = Array.isArray(data) ? data : [data];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
    
    array.forEach(item => {
      xml += '  <item>\n';
      Object.entries(item).forEach(([key, value]) => {
        xml += `    <${key}>${value}</${key}>\n`;
      });
      xml += '  </item>\n';
    });
    
    xml += '</data>';
    return xml;
  }

  jsonToTxt(jsonString: string): string {
    const data = JSON.parse(jsonString);
    const array = Array.isArray(data) ? data : [data];
    
    return array.map((item, index) => {
      const lines = Object.entries(item).map(([key, value]) => `${key}: ${value}`);
      return lines.join('\n');
    }).join('\n\n');
  }

  formatData(data: string, targetFormat: string): string {
    try {
      // Assume data is JSON
      JSON.parse(data);
      
      switch (targetFormat.toUpperCase()) {
        case 'CSV':
          return this.jsonToCsv(data);
        case 'XML':
          return this.jsonToXml(data);
        case 'TXT':
          return this.jsonToTxt(data);
        case 'JSON':
          return JSON.stringify(JSON.parse(data), null, 2);
        default:
          return data;
      }
    } catch (error) {
      return data;
    }
  }

  prettifyJson(jsonString: string, indent: number = 2): string {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, indent);
  }

  minifyJson(jsonString: string): string {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  }

  validateFormat(data: string, format: string): boolean {
    try {
      switch (format.toUpperCase()) {
        case 'JSON':
          JSON.parse(data);
          return true;
        case 'CSV':
          return data.includes('\n') || data.includes(',');
        case 'XML':
          return data.includes('<?xml') || data.includes('<');
        case 'TXT':
          return typeof data === 'string';
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
}

describe('DataFormatter Service', () => {
  let formatter: DataFormatter;

  beforeEach(() => {
    formatter = new DataFormatter();
  });

  describe('JSON to CSV Conversion', () => {
    it('should convert simple JSON array to CSV', () => {
      const json = JSON.stringify([
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ]);

      const csv = formatter.jsonToCsv(json);
      
      expect(csv).toContain('name,age');
      expect(csv).toContain('John,30');
      expect(csv).toContain('Jane,25');
    });

    it('should handle values with commas', () => {
      const json = JSON.stringify([
        { name: 'Doe, John', city: 'New York, NY' },
      ]);

      const csv = formatter.jsonToCsv(json);
      
      expect(csv).toContain('"Doe, John"');
      expect(csv).toContain('"New York, NY"');
    });

    it('should handle empty array', () => {
      const json = JSON.stringify([]);
      const csv = formatter.jsonToCsv(json);
      
      expect(csv).toBe('');
    });

    it('should handle single object', () => {
      const json = JSON.stringify({ name: 'John', age: 30 });
      const csv = formatter.jsonToCsv(json);
      
      expect(csv).toContain('name,age');
      expect(csv).toContain('John,30');
    });

    it('should handle different data types', () => {
      const json = JSON.stringify([
        { name: 'John', age: 30, active: true, score: 95.5 },
      ]);

      const csv = formatter.jsonToCsv(json);
      
      expect(csv).toContain('name,age,active,score');
      expect(csv).toContain('John,30,true,95.5');
    });

    it('should maintain column order', () => {
      const json = JSON.stringify([
        { id: 1, name: 'John', age: 30 },
        { id: 2, name: 'Jane', age: 25 },
      ]);

      const csv = formatter.jsonToCsv(json);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('id,name,age');
    });
  });

  describe('JSON to XML Conversion', () => {
    it('should convert JSON array to XML', () => {
      const json = JSON.stringify([
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ]);

      const xml = formatter.jsonToXml(json);
      
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain('<data>');
      expect(xml).toContain('<item>');
      expect(xml).toContain('<name>John</name>');
      expect(xml).toContain('<age>30</age>');
    });

    it('should handle special characters', () => {
      const json = JSON.stringify([
        { name: 'John & Jane', note: '<important>' },
      ]);

      const xml = formatter.jsonToXml(json);
      
      expect(xml).toContain('<name>John & Jane</name>');
    });

    it('should handle empty array', () => {
      const json = JSON.stringify([]);
      const xml = formatter.jsonToXml(json);
      
      expect(xml).toContain('<data>');
      expect(xml).toContain('</data>');
    });

    it('should handle nested objects', () => {
      const json = JSON.stringify([
        { name: 'John', details: { age: 30, city: 'NYC' } },
      ]);

      const xml = formatter.jsonToXml(json);
      expect(xml).toContain('<item>');
    });

    it('should properly close all tags', () => {
      const json = JSON.stringify([
        { name: 'John', age: 30 },
      ]);

      const xml = formatter.jsonToXml(json);
      
      const openTags = (xml.match(/</g) || []).length;
      const closeTags = (xml.match(/>/g) || []).length;
      
      expect(openTags).toBe(closeTags);
    });
  });

  describe('JSON to TXT Conversion', () => {
    it('should convert JSON to readable text', () => {
      const json = JSON.stringify([
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ]);

      const txt = formatter.jsonToTxt(json);
      
      expect(txt).toContain('name: John');
      expect(txt).toContain('age: 30');
      expect(txt).toContain('name: Jane');
      expect(txt).toContain('age: 25');
    });

    it('should separate records with blank lines', () => {
      const json = JSON.stringify([
        { name: 'John' },
        { name: 'Jane' },
      ]);

      const txt = formatter.jsonToTxt(json);
      
      expect(txt).toContain('\n\n');
    });

    it('should handle single object', () => {
      const json = JSON.stringify({ name: 'John', age: 30 });
      const txt = formatter.jsonToTxt(json);
      
      expect(txt).toContain('name: John');
      expect(txt).not.toContain('\n\n');
    });

    it('should handle various data types', () => {
      const json = JSON.stringify([
        { string: 'text', number: 42, boolean: true, decimal: 3.14 },
      ]);

      const txt = formatter.jsonToTxt(json);
      
      expect(txt).toContain('string: text');
      expect(txt).toContain('number: 42');
      expect(txt).toContain('boolean: true');
      expect(txt).toContain('decimal: 3.14');
    });
  });

  describe('Format Data', () => {
    it('should format to JSON with proper indentation', () => {
      const json = '{"name":"John","age":30}';
      const formatted = formatter.formatData(json, 'JSON');
      
      expect(formatted).toContain('  ');
      expect(formatted).toContain('\n');
    });

    it('should format to CSV', () => {
      const json = JSON.stringify([{ name: 'John', age: 30 }]);
      const csv = formatter.formatData(json, 'CSV');
      
      expect(csv).toContain('name,age');
      expect(csv).toContain('John,30');
    });

    it('should format to XML', () => {
      const json = JSON.stringify([{ name: 'John' }]);
      const xml = formatter.formatData(json, 'XML');
      
      expect(xml).toContain('<?xml');
      expect(xml).toContain('<name>John</name>');
    });

    it('should format to TXT', () => {
      const json = JSON.stringify([{ name: 'John' }]);
      const txt = formatter.formatData(json, 'TXT');
      
      expect(txt).toContain('name: John');
    });

    it('should handle case-insensitive format names', () => {
      const json = JSON.stringify([{ name: 'John' }]);
      
      expect(formatter.formatData(json, 'csv')).toContain('name');
      expect(formatter.formatData(json, 'Csv')).toContain('name');
      expect(formatter.formatData(json, 'CSV')).toContain('name');
    });

    it('should return original data for unknown formats', () => {
      const data = 'some data';
      const result = formatter.formatData(data, 'UNKNOWN');
      
      expect(result).toBe(data);
    });

    it('should handle invalid JSON gracefully', () => {
      const invalid = 'not json';
      const result = formatter.formatData(invalid, 'CSV');
      
      expect(result).toBe(invalid);
    });
  });

  describe('JSON Prettify', () => {
    it('should prettify minified JSON', () => {
      const minified = '{"name":"John","age":30}';
      const prettified = formatter.prettifyJson(minified);
      
      expect(prettified).toContain('  ');
      expect(prettified).toContain('\n');
    });

    it('should handle custom indentation', () => {
      const json = '{"name":"John"}';
      const prettified = formatter.prettifyJson(json, 4);
      
      expect(prettified).toContain('    ');
    });

    it('should handle nested objects', () => {
      const json = '{"user":{"name":"John","age":30}}';
      const prettified = formatter.prettifyJson(json);
      
      expect(prettified).toContain('"user"');
      expect(prettified).toContain('"name"');
    });

    it('should handle arrays', () => {
      const json = '[1,2,3]';
      const prettified = formatter.prettifyJson(json);
      
      expect(prettified).toContain('[');
      expect(prettified).toContain(']');
    });
  });

  describe('JSON Minify', () => {
    it('should remove whitespace from formatted JSON', () => {
      const formatted = '{\n  "name": "John",\n  "age": 30\n}';
      const minified = formatter.minifyJson(formatted);
      
      expect(minified).not.toContain('\n');
      expect(minified).not.toContain('  ');
      expect(minified).toBe('{"name":"John","age":30}');
    });

    it('should preserve data integrity', () => {
      const original = '{"name":"John","age":30}';
      const prettified = formatter.prettifyJson(original);
      const minified = formatter.minifyJson(prettified);
      
      expect(minified).toBe(original);
    });
  });

  describe('Format Validation', () => {
    it('should validate JSON format', () => {
      expect(formatter.validateFormat('{"name":"John"}', 'JSON')).toBe(true);
      expect(formatter.validateFormat('invalid json', 'JSON')).toBe(false);
    });

    it('should validate CSV format', () => {
      expect(formatter.validateFormat('name,age\nJohn,30', 'CSV')).toBe(true);
      expect(formatter.validateFormat('name,age', 'CSV')).toBe(true);
    });

    it('should validate XML format', () => {
      expect(formatter.validateFormat('<?xml version="1.0"?><data></data>', 'XML')).toBe(true);
      expect(formatter.validateFormat('<data></data>', 'XML')).toBe(true);
      expect(formatter.validateFormat('not xml', 'XML')).toBe(false);
    });

    it('should validate TXT format', () => {
      expect(formatter.validateFormat('any text', 'TXT')).toBe(true);
      expect(formatter.validateFormat('', 'TXT')).toBe(true);
    });

    it('should reject unknown formats', () => {
      expect(formatter.validateFormat('data', 'UNKNOWN')).toBe(false);
    });

    it('should handle case-insensitive format names', () => {
      expect(formatter.validateFormat('{"name":"John"}', 'json')).toBe(true);
      expect(formatter.validateFormat('{"name":"John"}', 'Json')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large datasets', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
      }));
      const json = JSON.stringify(largeArray);
      
      const csv = formatter.jsonToCsv(json);
      expect(csv.split('\n').length).toBe(1001); // header + 1000 rows
    });

    it('should handle deeply nested objects', () => {
      const nested = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };
      
      expect(() => formatter.prettifyJson(JSON.stringify(nested))).not.toThrow();
    });

    it('should handle unicode characters', () => {
      const json = JSON.stringify([{ name: '日本', emoji: '😀' }]);
      const csv = formatter.jsonToCsv(json);
      
      expect(csv).toContain('日本');
      expect(csv).toContain('😀');
    });

    it('should handle null and undefined values', () => {
      const json = JSON.stringify([{ name: 'John', middle: null, last: undefined }]);
      const csv = formatter.jsonToCsv(json);
      
      expect(csv).toContain('John');
    });

    it('should handle empty strings', () => {
      const json = JSON.stringify([{ name: '', age: 30 }]);
      const csv = formatter.jsonToCsv(json);
      
      expect(csv).toContain(',30');
    });
  });
});
