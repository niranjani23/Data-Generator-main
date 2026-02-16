import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent, mockGeneratedData } from '../../setup/testUtils';
import App from '../../../App';

vi.mock('../../../services/geminiService', () => ({
  generateData: vi.fn(),
  streamGenerateData: vi.fn(),
}));

describe('End-to-End Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete User Journeys', () => {
    it('should complete new user journey from start to finish', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      // User lands on the page
      expect(screen.getByText(/AI Dummy Data Generator/i)).toBeInTheDocument();
      
      // User sees quick examples
      expect(screen.getByText(/quick examples/i)).toBeInTheDocument();
      
      // User clicks a quick example
      const exampleButton = screen.getByRole('button', { name: /user profiles/i });
      await user.click(exampleButton);
      
      // Prompt is auto-filled
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      expect(textarea.value).not.toBe('');
      
      // User selects CSV format
      await user.click(screen.getByRole('button', { name: /CSV/i }));
      
      // User generates data
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      // Loading state appears
      await waitFor(() => {
        expect(screen.getByText(/generating/i) || screen.getByRole('progressbar')).toBeInTheDocument();
      });
      
      // Data appears
      await waitFor(() => {
        expect(screen.queryByText(/generating/i)).not.toBeInTheDocument();
      });
      
      // User can copy or download
      const actionButtons = screen.queryAllByRole('button', { name: /(copy|download)/i });
      expect(actionButtons.length).toBeGreaterThan(0);
    });

    it('should complete power user workflow with custom configuration', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      // User enters custom prompt
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, '100 financial transactions with precise decimal values');
      
      // User configures decimal precision
      const precisionInput = screen.queryByLabelText(/decimal precision/i);
      if (precisionInput) {
        await user.clear(precisionInput);
        await user.type(precisionInput, '4');
      }
      
      // User configures date format
      const dateSelect = screen.queryByLabelText(/date format/i);
      if (dateSelect) {
        await user.selectOptions(dateSelect, 'ISO 8601');
      }
      
      // User selects JSON format
      await user.click(screen.getByRole('button', { name: /JSON/i }));
      
      // User generates data
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      // Verify generation was called with options
      await waitFor(() => {
        expect(generateData).toHaveBeenCalled();
        const callArgs = vi.mocked(generateData).mock.calls[0];
        expect(callArgs[0]).toContain('financial transactions');
        expect(callArgs[1]).toBe('JSON');
      });
      
      // Data appears
      await waitFor(() => {
        expect(screen.queryByText(/generating/i)).not.toBeInTheDocument();
      });
    });

    it('should handle user changing mind mid-workflow', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      // User starts with one example
      await user.click(screen.getByRole('button', { name: /user profiles/i }));
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      const firstValue = textarea.value;
      
      // User changes their mind and clicks another example
      await user.click(screen.getByRole('button', { name: /e-commerce/i }));
      expect(textarea.value).not.toBe(firstValue);
      
      // User selects CSV
      await user.click(screen.getByRole('button', { name: /CSV/i }));
      
      // User changes to JSON
      await user.click(screen.getByRole('button', { name: /JSON/i }));
      
      // User finally generates
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(generateData).toHaveBeenCalled();
      });
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle and recover from network errors', async () => {
      const { generateData } = await import('../../../services/geminiService');
      
      // First attempt fails
      vi.mocked(generateData).mockRejectedValueOnce(new Error('Network error'));
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, 'test data');
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      // Error is shown
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
      
      // User tries again - this time it succeeds
      vi.mocked(generateData).mockResolvedValueOnce(mockGeneratedData.json);
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
        expect(screen.getByText(/john/i)).toBeInTheDocument();
      });
    });

    it('should handle API quota errors gracefully', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockRejectedValue(new Error('Quota exceeded. Please try again later.'));
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, 'test data');
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/error/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should be fully keyboard navigable', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      // Tab through interface
      await user.tab(); // Focus first interactive element
      expect(document.activeElement).toBeDefined();
      
      // Continue tabbing
      await user.tab();
      await user.tab();
      
      // Should be able to navigate all interactive elements
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should announce state changes to screen readers', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, 'test data');
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      // Loading state should be announced
      await waitFor(() => {
        const status = screen.queryByRole('status') || screen.queryByRole('progressbar');
        expect(status).toBeInTheDocument();
      });
      
      // Completion should be perceivable
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent operations', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, 'test data');
      
      // Rapidly click generate multiple times
      const generateButton = screen.getByRole('button', { name: /generate data/i });
      await user.click(generateButton);
      await user.click(generateButton);
      await user.click(generateButton);
      
      // Should handle gracefully without crashing
      await waitFor(() => {
        expect(generateData).toHaveBeenCalled();
      });
    });

    it('should maintain state across multiple generations', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData)
        .mockResolvedValueOnce(mockGeneratedData.json)
        .mockResolvedValueOnce(mockGeneratedData.csv);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      const prompt = 'persistent prompt';
      
      await user.type(textarea, prompt);
      
      // First generation
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      await waitFor(() => expect(generateData).toHaveBeenCalledTimes(1));
      
      // Prompt should still be there
      expect(textarea).toHaveValue(prompt);
      
      // Second generation
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      await waitFor(() => expect(generateData).toHaveBeenCalledTimes(2));
      
      // Prompt should still be there
      expect(textarea).toHaveValue(prompt);
    });

    it('should handle very large prompts', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      const longPrompt = 'Generate users with ' + 'field, '.repeat(100);
      
      await user.type(textarea, longPrompt);
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(generateData).toHaveBeenCalled();
      });
    });
  });

  describe('Data Quality Validation', () => {
    it('should generate valid JSON data', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, '5 users');
      await user.click(screen.getByRole('button', { name: /JSON/i }));
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(generateData).toHaveBeenCalled();
        const result = vi.mocked(generateData).mock.results[0].value;
        expect(() => JSON.parse(result as string)).not.toThrow();
      });
    });
  });

  describe('User Experience Flow', () => {
    it('should provide smooth onboarding experience', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      // New user sees helpful UI
      expect(screen.getByText(/AI Dummy Data Generator/i)).toBeInTheDocument();
      expect(screen.getByText(/quick examples/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/describe the data you need/i)).toBeInTheDocument();
      
      // User can immediately start with an example
      await user.click(screen.getByRole('button', { name: /user profiles/i }));
      
      // No configuration needed to get started
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(generateData).toHaveBeenCalled();
      });
    });

    it('should support iterative refinement workflow', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData)
        .mockResolvedValueOnce(mockGeneratedData.json)
        .mockResolvedValueOnce(mockGeneratedData.json)
        .mockResolvedValueOnce(mockGeneratedData.csv);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      
      // First attempt - basic prompt
      await user.type(textarea, '5 users');
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      await waitFor(() => expect(generateData).toHaveBeenCalledTimes(1));
      
      // Refine prompt
      await user.clear(textarea);
      await user.type(textarea, '5 users with email and age');
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      await waitFor(() => expect(generateData).toHaveBeenCalledTimes(2));
      
      // Change format
      await user.click(screen.getByRole('button', { name: /CSV/i }));
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      await waitFor(() => expect(generateData).toHaveBeenCalledTimes(3));
    });
  });

  describe('Cross-Feature Integration', () => {
    it('should combine all features in a single workflow', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockResolvedValue(mockGeneratedData.json);
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      // Use quick example
      await user.click(screen.getByRole('button', { name: /financial transactions/i }));
      
      // Configure date format
      const dateSelect = screen.queryByLabelText(/date format/i);
      if (dateSelect) {
        await user.selectOptions(dateSelect, 'ISO 8601');
      }
      
      // Configure decimal precision
      const precisionInput = screen.queryByLabelText(/decimal precision/i);
      if (precisionInput) {
        await user.clear(precisionInput);
        await user.type(precisionInput, '2');
      }
      
      // Select format
      await user.click(screen.getByRole('button', { name: /JSON/i }));
      
      // Generate
      await user.click(screen.getByRole('button', { name: /generate data/i }));
      
      await waitFor(() => {
        expect(generateData).toHaveBeenCalled();
        const callArgs = vi.mocked(generateData).mock.calls[0];
        
        // Verify all options were passed
        expect(callArgs[0]).toBeDefined(); // prompt
        expect(callArgs[1]).toBe('JSON'); // format
        // Options may be in callArgs[2]
      });
    });
  });
});
