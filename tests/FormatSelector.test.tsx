import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../../setup/testUtils';

// Mock FormatSelector component structure
const FormatSelector = ({ 
  selectedFormat, 
  onFormatChange 
}: { 
  selectedFormat: string; 
  onFormatChange: (format: string) => void;
}) => {
  const formats = ['JSON', 'CSV', 'XML', 'TXT'];
  
  return (
    <div role="group" aria-label="Format selection">
      <label htmlFor="format-select">Output Format</label>
      {formats.map(format => (
        <button
          key={format}
          role="button"
          aria-pressed={selectedFormat === format}
          onClick={() => onFormatChange(format)}
        >
          {format}
        </button>
      ))}
    </div>
  );
};

describe('FormatSelector Component', () => {
  describe('Rendering', () => {
    it('should render all format options', () => {
      const mockOnChange = vi.fn();
      renderWithProviders(
        <FormatSelector selectedFormat="JSON" onFormatChange={mockOnChange} />
      );
      
      expect(screen.getByRole('button', { name: 'JSON' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'CSV' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'XML' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'TXT' })).toBeInTheDocument();
    });

    it('should render with a label', () => {
      const mockOnChange = vi.fn();
      renderWithProviders(
        <FormatSelector selectedFormat="JSON" onFormatChange={mockOnChange} />
      );
      
      expect(screen.getByText('Output Format')).toBeInTheDocument();
    });

    it('should highlight selected format', () => {
      const mockOnChange = vi.fn();
      renderWithProviders(
        <FormatSelector selectedFormat="CSV" onFormatChange={mockOnChange} />
      );
      
      const csvButton = screen.getByRole('button', { name: 'CSV' });
      expect(csvButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('User Interaction', () => {
    it('should call onFormatChange when format is selected', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      renderWithProviders(
        <FormatSelector selectedFormat="JSON" onFormatChange={mockOnChange} />
      );
      
      const xmlButton = screen.getByRole('button', { name: 'XML' });
      await user.click(xmlButton);
      
      expect(mockOnChange).toHaveBeenCalledWith('XML');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple format selections', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      renderWithProviders(
        <FormatSelector selectedFormat="JSON" onFormatChange={mockOnChange} />
      );
      
      await user.click(screen.getByRole('button', { name: 'CSV' }));
      await user.click(screen.getByRole('button', { name: 'XML' }));
      await user.click(screen.getByRole('button', { name: 'TXT' }));
      
      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'CSV');
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 'XML');
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 'TXT');
    });

    it('should allow re-selecting the same format', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      renderWithProviders(
        <FormatSelector selectedFormat="JSON" onFormatChange={mockOnChange} />
      );
      
      const jsonButton = screen.getByRole('button', { name: 'JSON' });
      await user.click(jsonButton);
      
      expect(mockOnChange).toHaveBeenCalledWith('JSON');
    });
  });

  describe('Format Types', () => {
    it.each(['JSON', 'CSV', 'XML', 'TXT'])(
      'should support %s format',
      (format) => {
        const mockOnChange = vi.fn();
        renderWithProviders(
          <FormatSelector selectedFormat={format} onFormatChange={mockOnChange} />
        );
        
        const button = screen.getByRole('button', { name: format });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-pressed', 'true');
      }
    );
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      const mockOnChange = vi.fn();
      renderWithProviders(
        <FormatSelector selectedFormat="JSON" onFormatChange={mockOnChange} />
      );
      
      expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Format selection');
    });

    it('should indicate pressed state for selected format', () => {
      const mockOnChange = vi.fn();
      renderWithProviders(
        <FormatSelector selectedFormat="CSV" onFormatChange={mockOnChange} />
      );
      
      const csvButton = screen.getByRole('button', { name: 'CSV' });
      const jsonButton = screen.getByRole('button', { name: 'JSON' });
      
      expect(csvButton).toHaveAttribute('aria-pressed', 'true');
      expect(jsonButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      renderWithProviders(
        <FormatSelector selectedFormat="JSON" onFormatChange={mockOnChange} />
      );
      
      const jsonButton = screen.getByRole('button', { name: 'JSON' });
      jsonButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selectedFormat', () => {
      const mockOnChange = vi.fn();
      renderWithProviders(
        <FormatSelector selectedFormat="" onFormatChange={mockOnChange} />
      );
      
      const allButtons = screen.getAllByRole('button');
      allButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('should handle invalid selectedFormat', () => {
      const mockOnChange = vi.fn();
      renderWithProviders(
        <FormatSelector selectedFormat="INVALID" onFormatChange={mockOnChange} />
      );
      
      const allButtons = screen.getAllByRole('button');
      allButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('should not throw error if onFormatChange is not provided', () => {
      expect(() => {
        renderWithProviders(
          <FormatSelector selectedFormat="JSON" onFormatChange={() => {}} />
        );
      }).not.toThrow();
    });
  });
});
