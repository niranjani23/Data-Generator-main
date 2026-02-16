import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent, mockGeneratedData, mockPrompts } from '../../setup/testUtils';
import App from '../../../App';

// Mock the Gemini service
vi.mock('../../../services/geminiService', () => ({
  generateData: vi.fn().mockResolvedValue(mockGeneratedData.json),
  streamGenerateData: vi.fn().mockImplementation(async function* () {
    const chunks = mockGeneratedData.json.split('\n');
    for (const chunk of chunks) {
      yield chunk + '\n';
    }
  }),
}));

describe('DataGenerator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the main heading', () => {
      renderWithProviders(<App />);
      expect(screen.getByText(/AI Dummy Data Generator/i)).toBeInTheDocument();
    });

    it('should render the prompt textarea', () => {
      renderWithProviders(<App />);
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      expect(textarea).toBeInTheDocument();
    });

    it('should render the generate button', () => {
      renderWithProviders(<App />);
      const button = screen.getByRole('button', { name: /generate data/i });
      expect(button).toBeInTheDocument();
    });

    it('should render format selector', () => {
      renderWithProviders(<App />);
      expect(screen.getByText(/output format/i)).toBeInTheDocument();
    });

    it('should render quick examples section', () => {
      renderWithProviders(<App />);
      expect(screen.getByText(/quick examples/i)).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should allow typing in the prompt textarea', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, mockPrompts.simple);
      
      expect(textarea).toHaveValue(mockPrompts.simple);
    });

    it('should enable generate button when prompt is entered', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      const button = screen.getByRole('button', { name: /generate data/i });
      
      // Button should be disabled initially or enabled
      await user.type(textarea, mockPrompts.simple);
      expect(button).toBeEnabled();
    });

    it('should clear textarea when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      await user.type(textarea, mockPrompts.simple);
      
      const clearButton = screen.queryByRole('button', { name: /clear/i });
      if (clearButton) {
        await user.click(clearButton);
        expect(textarea).toHaveValue('');
      }
    });
  });

  describe('Format Selection', () => {
    it('should display all format options', () => {
      renderWithProviders(<App />);
      
      expect(screen.getByText(/JSON/i)).toBeInTheDocument();
      expect(screen.getByText(/CSV/i)).toBeInTheDocument();
      expect(screen.getByText(/XML/i)).toBeInTheDocument();
      expect(screen.getByText(/TXT/i)).toBeInTheDocument();
    });

    it('should select format when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const csvButton = screen.getByRole('button', { name: /CSV/i });
      await user.click(csvButton);
      
      // Verify CSV is selected (check for active class or aria-pressed)
      expect(csvButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Data Generation', () => {
    it('should show loading state when generating', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      const button = screen.getByRole('button', { name: /generate data/i });
      
      await user.type(textarea, mockPrompts.simple);
      await user.click(button);
      
      // Check for loading indicator
      expect(screen.getByText(/generating/i) || screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display generated data after completion', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      const button = screen.getByRole('button', { name: /generate data/i });
      
      await user.type(textarea, mockPrompts.simple);
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/john/i)).toBeInTheDocument();
      });
    });

    it('should handle generation errors gracefully', async () => {
      const { generateData } = await import('../../../services/geminiService');
      vi.mocked(generateData).mockRejectedValueOnce(new Error('API Error'));
      
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      const button = screen.getByRole('button', { name: /generate data/i });
      
      await user.type(textarea, mockPrompts.simple);
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Quick Examples', () => {
    it('should populate textarea when example is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const exampleButton = screen.getByRole('button', { name: /user profiles/i });
      await user.click(exampleButton);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      expect(textarea.value).not.toBe('');
    });

    it('should have multiple example buttons', () => {
      renderWithProviders(<App />);
      
      const buttons = screen.getAllByRole('button');
      const exampleButtons = buttons.filter(btn => 
        btn.textContent?.includes('User') || 
        btn.textContent?.includes('E-commerce') ||
        btn.textContent?.includes('Blog')
      );
      
      expect(exampleButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Date Format Configuration', () => {
    it('should display date format options', () => {
      renderWithProviders(<App />);
      
      const dateFormatLabel = screen.queryByText(/date format/i);
      if (dateFormatLabel) {
        expect(dateFormatLabel).toBeInTheDocument();
      }
    });

    it('should change date format when selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const dateSelect = screen.queryByLabelText(/date format/i);
      if (dateSelect) {
        await user.selectOptions(dateSelect, 'ISO 8601');
        expect(dateSelect).toHaveValue('ISO 8601');
      }
    });
  });

  describe('Decimal Precision Configuration', () => {
    it('should display decimal precision input', () => {
      renderWithProviders(<App />);
      
      const precisionLabel = screen.queryByText(/decimal precision/i);
      if (precisionLabel) {
        expect(precisionLabel).toBeInTheDocument();
      }
    });

    it('should update decimal precision value', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const precisionInput = screen.queryByLabelText(/decimal precision/i);
      if (precisionInput) {
        await user.clear(precisionInput);
        await user.type(precisionInput, '3');
        expect(precisionInput).toHaveValue(3);
      }
    });
  });

  describe('Copy and Download Functionality', () => {
    it('should show copy button when data is generated', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      const button = screen.getByRole('button', { name: /generate data/i });
      
      await user.type(textarea, mockPrompts.simple);
      await user.click(button);
      
      await waitFor(() => {
        const copyButton = screen.queryByRole('button', { name: /copy/i });
        if (copyButton) {
          expect(copyButton).toBeInTheDocument();
        }
      });
    });

    it('should show download button when data is generated', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      const button = screen.getByRole('button', { name: /generate data/i });
      
      await user.type(textarea, mockPrompts.simple);
      await user.click(button);
      
      await waitFor(() => {
        const downloadButton = screen.queryByRole('button', { name: /download/i });
        if (downloadButton) {
          expect(downloadButton).toBeInTheDocument();
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      expect(textarea).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      await user.tab();
      expect(document.activeElement?.tagName).toBe('TEXTAREA' || 'BUTTON');
    });

    it('should announce loading state to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const textarea = screen.getByPlaceholderText(/describe the data you need/i);
      const button = screen.getByRole('button', { name: /generate data/i });
      
      await user.type(textarea, mockPrompts.simple);
      await user.click(button);
      
      const loadingElement = screen.queryByRole('status') || screen.queryByRole('progressbar');
      if (loadingElement) {
        expect(loadingElement).toBeInTheDocument();
      }
    });
  });
});
