import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockGeneratedData } from '../../setup/testUtils';

// Mock the @google/genai package
const mockGenerateContent = vi.fn();
const mockGenerateContentStream = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
      generateContentStream: mockGenerateContentStream,
    }),
  })),
}));

// Service implementation
class GeminiService {
  private apiKey: string;
  private model: any;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateData(prompt: string, format: string, options?: any): Promise<string> {
    const fullPrompt = this.buildPrompt(prompt, format, options);
    const result = await mockGenerateContent({ contents: [{ parts: [{ text: fullPrompt }] }] });
    return result.response.text();
  }

  async *streamGenerateData(prompt: string, format: string, options?: any): AsyncGenerator<string> {
    const fullPrompt = this.buildPrompt(prompt, format, options);
    const stream = await mockGenerateContentStream({ contents: [{ parts: [{ text: fullPrompt }] }] });
    
    for await (const chunk of stream) {
      yield chunk.text();
    }
  }

  private buildPrompt(prompt: string, format: string, options?: any): string {
    let fullPrompt = `Generate ${prompt} in ${format} format.`;
    
    if (options?.dateFormat) {
      fullPrompt += ` Use ${options.dateFormat} format for dates.`;
    }
    
    if (options?.decimalPrecision !== undefined) {
      fullPrompt += ` Use ${options.decimalPrecision} decimal places for numbers.`;
    }
    
    return fullPrompt;
  }
}

describe('GeminiService', () => {
  let service: GeminiService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GeminiService('test-api-key');
  });

  describe('Initialization', () => {
    it('should initialize with API key', () => {
      expect(() => new GeminiService('test-key')).not.toThrow();
    });

    it('should create service instance', () => {
      const instance = new GeminiService('test-key');
      expect(instance).toBeDefined();
    });
  });

  describe('generateData', () => {
    it('should generate data successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockGeneratedData.json },
      });

      const result = await service.generateData('5 users', 'JSON');
      
      expect(result).toBe(mockGeneratedData.json);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should include prompt in API call', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockGeneratedData.json },
      });

      await service.generateData('10 products', 'JSON');
      
      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.contents[0].parts[0].text).toContain('10 products');
    });

    it('should include format in API call', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockGeneratedData.csv },
      });

      await service.generateData('5 users', 'CSV');
      
      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.contents[0].parts[0].text).toContain('CSV format');
    });

    it('should handle different formats', async () => {
      const formats = ['JSON', 'CSV', 'XML', 'TXT'];
      
      for (const format of formats) {
        mockGenerateContent.mockResolvedValue({
          response: { text: () => `data in ${format}` },
        });

        const result = await service.generateData('5 items', format);
        expect(result).toContain(format);
      }
    });

    it('should include date format in prompt when provided', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockGeneratedData.json },
      });

      await service.generateData('5 users', 'JSON', { dateFormat: 'ISO 8601' });
      
      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.contents[0].parts[0].text).toContain('ISO 8601');
    });

    it('should include decimal precision in prompt when provided', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockGeneratedData.json },
      });

      await service.generateData('5 transactions', 'JSON', { decimalPrecision: 2 });
      
      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.contents[0].parts[0].text).toContain('2 decimal places');
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(service.generateData('5 users', 'JSON')).rejects.toThrow('API Error');
    });

    it('should handle rate limit errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(service.generateData('5 users', 'JSON')).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle authentication errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Invalid API key'));

      await expect(service.generateData('5 users', 'JSON')).rejects.toThrow('Invalid API key');
    });
  });

  describe('streamGenerateData', () => {
    it('should stream data in chunks', async () => {
      const chunks = ['chunk1', 'chunk2', 'chunk3'];
      mockGenerateContentStream.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of chunks) {
            yield { text: () => chunk };
          }
        },
      });

      const result: string[] = [];
      for await (const chunk of service.streamGenerateData('5 users', 'JSON')) {
        result.push(chunk);
      }

      expect(result).toEqual(chunks);
    });

    it('should handle empty stream', async () => {
      mockGenerateContentStream.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {},
      });

      const result: string[] = [];
      for await (const chunk of service.streamGenerateData('5 users', 'JSON')) {
        result.push(chunk);
      }

      expect(result).toEqual([]);
    });

    it('should handle stream errors', async () => {
      mockGenerateContentStream.mockRejectedValue(new Error('Stream error'));

      await expect(async () => {
        for await (const chunk of service.streamGenerateData('5 users', 'JSON')) {
          // Should not reach here
        }
      }).rejects.toThrow('Stream error');
    });

    it('should include options in stream prompt', async () => {
      mockGenerateContentStream.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield { text: () => 'data' };
        },
      });

      const generator = service.streamGenerateData('5 users', 'JSON', { 
        dateFormat: 'ISO 8601',
        decimalPrecision: 2,
      });
      
      await generator.next();
      
      const callArg = mockGenerateContentStream.mock.calls[0][0];
      expect(callArg.contents[0].parts[0].text).toContain('ISO 8601');
      expect(callArg.contents[0].parts[0].text).toContain('2 decimal places');
    });
  });

  describe('Prompt Building', () => {
    it('should build basic prompt correctly', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockGeneratedData.json },
      });

      await service.generateData('5 users with name and email', 'JSON');
      
      const callArg = mockGenerateContent.mock.calls[0][0];
      const prompt = callArg.contents[0].parts[0].text;
      
      expect(prompt).toContain('Generate 5 users with name and email');
      expect(prompt).toContain('JSON format');
    });

    it('should build complex prompt with all options', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockGeneratedData.json },
      });

      await service.generateData('10 transactions', 'JSON', {
        dateFormat: 'YYYY-MM-DD',
        decimalPrecision: 2,
      });
      
      const callArg = mockGenerateContent.mock.calls[0][0];
      const prompt = callArg.contents[0].parts[0].text;
      
      expect(prompt).toContain('Generate 10 transactions');
      expect(prompt).toContain('JSON format');
      expect(prompt).toContain('YYYY-MM-DD');
      expect(prompt).toContain('2 decimal places');
    });

    it('should handle special characters in prompts', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockGeneratedData.json },
      });

      const specialPrompt = 'users with "special" & <characters>';
      await service.generateData(specialPrompt, 'JSON');
      
      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.contents[0].parts[0].text).toContain(specialPrompt);
    });
  });

  describe('Response Handling', () => {
    it('should extract text from response', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => 'generated data' },
      });

      const result = await service.generateData('5 users', 'JSON');
      expect(result).toBe('generated data');
    });

    it('should handle empty response', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => '' },
      });

      const result = await service.generateData('5 users', 'JSON');
      expect(result).toBe('');
    });

    it('should handle malformed response', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {},
      });

      await expect(service.generateData('5 users', 'JSON')).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long prompts', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockGeneratedData.json },
      });

      const longPrompt = 'users with ' + 'field, '.repeat(100);
      await service.generateData(longPrompt, 'JSON');
      
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should handle zero decimal precision', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockGeneratedData.json },
      });

      await service.generateData('5 items', 'JSON', { decimalPrecision: 0 });
      
      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.contents[0].parts[0].text).toContain('0 decimal places');
    });

    it('should handle concurrent requests', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockGeneratedData.json },
      });

      const promises = [
        service.generateData('5 users', 'JSON'),
        service.generateData('10 products', 'CSV'),
        service.generateData('15 posts', 'XML'),
      ];

      const results = await Promise.all(promises);
      expect(results.length).toBe(3);
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });
  });
});
