import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders, userEvent, mockGeneratedData, mockClipboard } from '../../setup/testUtils';

// Mock OutputDisplay component
const OutputDisplay = ({ 
  data, 
  format, 
  isLoading,
  onCopy,
  onDownload
}: { 
  data: string;
  format: string;
  isLoading?: boolean;
  onCopy?: () => void;
  onDownload?: () => void;
}) => {
  if (isLoading) {
    return (
      <div role="status" aria-live="polite">
        <p>Generating data...</p>
        <div role="progressbar" aria-valuenow={50} />
      </div>
    );
  }

  if (!data) {
    return <div>No data generated yet</div>;
  }

  return (
    <div role="region" aria-label="Generated output">
      <div className="output-header">
        <span>Output ({format})</span>
        <div className="actions">
          <button onClick={onCopy} aria-label="Copy to clipboard">
            Copy
          </button>
          <button onClick={onDownload} aria-label="Download file">
            Download
          </button>
        </div>
      </div>
      <pre className="output-content">
        <code>{data}</code>
      </pre>
    </div>
  );
};

describe('OutputDisplay Component', () => {
  describe('Rendering States', () => {
    it('should show message when no data is generated', () => {
      renderWithProviders(
        <OutputDisplay data="" format="JSON" />
      );
      
      expect(screen.getByText(/no data generated yet/i)).toBeInTheDocument();
    });

    it('should show loading state while generating', () => {
      renderWithProviders(
        <OutputDisplay data="" format="JSON" isLoading={true} />
      );
      
      expect(screen.getByText(/generating data/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display generated data', () => {
      renderWithProviders(
        <OutputDisplay data={mockGeneratedData.json} format="JSON" />
      );
      
      expect(screen.getByText(/john/i)).toBeInTheDocument();
      expect(screen.getByText(/jane/i)).toBeInTheDocument();
    });

    it('should show format in header', () => {
      renderWithProviders(
        <OutputDisplay data={mockGeneratedData.json} format="JSON" />
      );
      
      expect(screen.getByText(/output \(JSON\)/i)).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display JSON data correctly', () => {
      renderWithProviders(
        <OutputDisplay data={mockGeneratedData.json} format="JSON" />
      );
      
      const codeElement = screen.getByText(/john/i).closest('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement?.textContent).toContain('firstName');
    });

    it('should display CSV data correctly', () => {
      renderWithProviders(
        <OutputDisplay data={mockGeneratedData.csv} format="CSV" />
      );
      
      expect(screen.getByText(/id,firstName,lastName/i)).toBeInTheDocument();
    });

    it('should display XML data correctly', () => {
      renderWithProviders(
        <OutputDisplay data={mockGeneratedData.xml} format="XML" />
      );
      
      expect(screen.getByText(/<?xml version/i)).toBeInTheDocument();
    });

    it('should display TXT data correctly', () => {
      renderWithProviders(
        <OutputDisplay data={mockGeneratedData.txt} format="TXT" />
      );
      
      expect(screen.getByText(/ID: 1/i)).toBeInTheDocument();
    });

    it('should preserve formatting in pre element', () => {
      renderWithProviders(
        <OutputDisplay data={mockGeneratedData.json} format="JSON" />
      );
      
      const preElement = screen.getByRole('region').querySelector('pre');
      expect(preElement).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should show copy button when data exists', () => {
      renderWithProviders(
        <OutputDisplay data={mockGeneratedData.json} format="JSON" />
      );
      
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('should call onCopy when copy button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCopy = vi.fn();
      
      renderWithProviders(
        <OutputDisplay 
          data={mockGeneratedData.json} 
          format="JSON" 
          onCopy={mockOnCopy}
        />
      );
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);
      
      expect(mockOnCopy).toHaveBeenCalledTimes(1);
    });

    it('should have accessible label for copy button', () => {
      renderWithProviders(
        <OutputDisplay data={mockGeneratedData.json} format="JSON" />
      );
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toHaveAttribute('aria-label', 'Copy to clipboard');
    });
  });

  describe('Download Functionality', () => {
    it('should show download button when data exists', () => {
      renderWithProviders(
        <OutputDisplay data={mockGeneratedData.json} format="JSON" />
      );
      
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });

    it('should call onDownload when download button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnDownload = vi.fn();
      
      renderWithProviders(
        <OutputDisplay 
          data={mockGeneratedData.json} 
          format="JSON" 
          onDownload={mockOnDownload}
        />
      );
      
      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);
      
      expect(mockOnDownload).toHaveBeenCalledTimes(1);
    });

    it('should have accessible label for download button', () => {
      renderWithProviders(
        <OutputDisplay data={mockGeneratedData.json} format="JSON" />
      );
      
      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toHaveAttribute('aria-label', 'Download file');
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator', () => {
      renderWithProviders(
        <OutputDisplay data="" format="JSON" isLoading={true} />
      );
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should not show action buttons while loading', () => {
      renderWithProviders(
        <OutputDisplay data="" format="JSON" isLoading={true} />
      );
      
      expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
    });

    it('should announce loading to screen readers', () => {
      renderWithProviders(
        <OutputDisplay data="" format="JSON" isLoading={true} />
      );
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long data strings', () => {
      const longData = 'x'.repeat(10000);
      
      renderWithProviders(
        <OutputDisplay data={longData} format="JSON" />
      );
      
      const codeElement = screen.getByRole('region').querySelector('code');
      expect(codeElement?.textContent?.length).toBeGreaterThan(9000);
    });

    it('should handle special characters in data', () => {
      const specialData = '{"special": "<>&\'"\\"}';
      
      renderWithProviders(
        <OutputDisplay data={specialData} format="JSON" />
      );
      
      expect(screen.getByText(/<>&/)).toBeInTheDocument();
    });

    it('should handle multiline data', () => {
      const multilineData = 'Line 1\nLine 2\nLine 3';
      
      renderWithProviders(
        <OutputDisplay data={multilineData} format="TXT" />
      );
      
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      expect(screen.getByText(/Line 2/)).toBeInTheDocument();
    });

    it('should handle empty string data', () => {
      renderWithProviders(
        <OutputDisplay data="" format="JSON" />
      );
      
      expect(screen.getByText(/no data generated/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper region role', () => {
      renderWithProviders(
        <OutputDisplay data={mockGeneratedData.json} format="JSON" />
      );
      
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Generated output');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const mockOnCopy = vi.fn();
      
      renderWithProviders(
        <OutputDisplay 
          data={mockGeneratedData.json} 
          format="JSON" 
          onCopy={mockOnCopy}
        />
      );
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      copyButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockOnCopy).toHaveBeenCalled();
    });

    it('should maintain focus after actions', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <OutputDisplay data={mockGeneratedData.json} format="JSON" />
      );
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);
      
      // Focus should remain on an actionable element
      expect(document.activeElement?.tagName).toBe('BUTTON');
    });
  });
});
