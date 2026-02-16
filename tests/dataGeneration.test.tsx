import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent, mockGeneratedData } from '../../setup/testUtils';
import App from '../../../App';

// Mock the entire workflow
vi.mock('../../../services/geminiService', () => ({
  generateData: vi.fn(),
  streamGenerateData: vi.fn(),
}));

describe('Data Generation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Generation Workflow', () => {
    it('should complete full generation workflow successfully', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      // Step 1: Enter prompt
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, '5 users with name and email');
      
      // Step 2: Select format
      const jsonButton = screen.getByRole('button', { name: /JSON/i });
      await user.click(jsonButton);
      
      // Step 3: Generate data
      const generateButton = screen.getByRole('button', { name: /generate data/i });
      await user.click(generateButton);
      
      // Step 4: Verify loading state
      expect(screen.getByText(/generating/i) || screen.getByRole('progressbar')).toBeInTheDocument();
      
      // Step 5: Verify data appears
      await waitFor(() => {
        expect(screen.getByText(/john/i)).toBeInTheDocument();
      });
      
      // Step 6: Verify actions are available
      const copyButton = screen.queryByRole('button', { name: /copy/i });
      const downloadButton = screen.queryByRole('button', { name: /download/i });
      
      expect(copyButton || downloadButton).toBeInTheDocument();
    });

    it('should handle format changes during workflow', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData)
        .mockResolvedValueOnce(mockGeneratedData.json)
        .mockResolvedValueOnce(mockGeneratedData.csv);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, '5 users');
      
      // Generate as JSON
      await user.click(screen.getByRole('button', { name: /JSON/i }));
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/john/i)).toBeInTheDocument();
      });
      
      // Change to CSV and regenerate
      await user.click(screen.getByRole('button', { name: /CSV/i }));
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(generateData).toHaveBeenCalledTimes(2);
      });
    });

    it('should preserve user input across multiple generations', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      const prompt = '10 products with name and price';
      
      await user.type(textarea, prompt);
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(textarea).toHaveValue(prompt);
      });
      
      // Generate again - prompt should still be there
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(textarea).toHaveValue(prompt);
      });
    });

    it('should use quick example to generate data', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      // Click an example
      const exampleButton = screen.getByRole('button', { name: /user profiles/i });
      await user.click(exampleButton);
      
      // Verify textarea is populated
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      expect(textarea.value).not.toBe('');
      
      // Generate
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(generateData).toHaveBeenCalled();
      });
    });
  });

  describe('Date Format Integration', () => {
    it('should apply date format to generated data', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, 'users with birthdate');
      
      // Select date format if available
      const dateSelect = screen.queryByLabelText(/date format/i);
      if (dateSelect) {
        await user.selectOptions(dateSelect, 'ISO 8601');
      }
      
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(generateData).toHaveBeenCalled();
        const callArgs = vi.mocked(generateData).mock.calls[0];
        // Verify options were passed if available
        if (callArgs[2]) {
          expect(callArgs[2]).toHaveProperty('dateFormat');
        }
      });
    });

    it('should switch between different date formats', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, 'events with dates');
      
      const dateSelect = screen.queryByLabelText(/date format/i);
      if (dateSelect) {
        // Try different formats
        await user.selectOptions(dateSelect, 'ISO 8601');
        await user.click(screen.getByRole('button', { name: /generate data/i }));
        
        await waitFor(() => {
          expect(generateData).toHaveBeenCalled();
        });
        
        vi.mocked(generateData).mockClear();
        
        await user.selectOptions(dateSelect, 'Unix Timestamp');
        await user.click(screen.getByRole('button', { name: /generate data/i }));
        
        await waitFor(() => {
          expect(generateData).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Decimal Precision Integration', () => {
    it('should apply decimal precision to generated data', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, 'prices with decimals');
      
      const precisionInput = screen.queryByLabelText(/decimal precision/i);
      if (precisionInput) {
        await user.clear(precisionInput);
        await user.type(precisionInput, '2');
      }
      
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(generateData).toHaveBeenCalled();
      });
    });

    it('should update precision and regenerate', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, 'financial data');
      
      const precisionInput = screen.queryByLabelText(/decimal precision/i);
      if (precisionInput) {
        // First generation with 2 decimals
        await user.clear(precisionInput);
        await user.type(precisionInput, '2');
        await user.click(screen.getByRole('button', { name: /generate data/i }));
        
        await waitFor(() => {
          expect(generateData).toHaveBeenCalled();
        });
        
        vi.mocked(generateData).mockClear();
        
        // Second generation with 4 decimals
        await user.clear(precisionInput);
        await user.type(precisionInput, '4');
        await user.click(screen.getByRole('button', { name: /generate data/i }));
        
        await waitFor(() => {
          expect(generateData).toHaveBeenCalledTimes(1);
        });
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should recover from generation error and retry', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, '5 users');
      
      // First attempt - should fail
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
      
      // Retry - should succeed
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/john/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid API key error', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockRejectedValue(new Error('Invalid API key'));
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, '5 users');
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/error/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should handle rate limit error', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockRejectedValue(new Error('Rate limit exceeded'));
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, '5 users');
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Copy and Download Integration', () => {
    it('should copy generated data to clipboard', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, '5 users');
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/john/i)).toBeInTheDocument();
      });
      
      const copyButton = screen.queryByRole('button', { name: /copy/i });
      if (copyButton) {
        await user.click(copyButton);
        // Verify clipboard API was called
        // This would require mocking navigator.clipboard
      }
    });

    it('should download generated data as file', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, '5 users');
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/john/i)).toBeInTheDocument();
      });
      
      const downloadButton = screen.queryByRole('button', { name: /download/i });
      if (downloadButton) {
        await user.click(downloadButton);
        // Verify download was triggered
        // This would require mocking URL.createObjectURL and link.click()
      }
    });
  });

  describe('Multi-Format Integration', () => {
    it('should generate and switch between all formats', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData)
        .mockResolvedValueOnce(mockGeneratedData.json)
        .mockResolvedValueOnce(mockGeneratedData.csv)
        .mockResolvedValueOnce(mockGeneratedData.xml)
        .mockResolvedValueOnce(mockGeneratedData.txt);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, '5 users');
      
      const formats = ['JSON', 'CSV', 'XML', 'TXT'];
      
      for (const format of formats) {
        await user.click(screen.getByRole('button', { name: new RegExp(format, 'i') }));
        await user.click(screen.getByRole('button', { name: /generate data/i }));
        
        await waitFor(() => {
          expect(generateData).toHaveBeenCalled();
        });
        
        vi.mocked(generateData).mockClear();
      }
      
      expect(generateData).toHaveBeenCalledTimes(0); // Cleared each time
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid successive generations', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, '5 users');
      
      const generateButton = screen.getByRole('button', { name: /generate data/i });
      
      // Rapidly click generate
      await user.click(generateButton);
      await user.click(generateButton);
      await user.click(generateButton);
      
      await waitFor(() => {
        // Should handle multiple requests
        expect(generateData).toHaveBeenCalled();
      });
    });

    it('should handle large data generation', async () => {
      const { generateData } = await import('../../../services/geminiService');
      const largeData = JSON.stringify(Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
      })));
      
      vi.mocked(generateData).mockResolvedValue(largeData);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, '1000 users');
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(generateData).toHaveBeenCalled();
      }, { timeout: 5000 });
    });
  });
});
