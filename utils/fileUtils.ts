import { DataFormat } from '../types';

const getMimeType = (format: DataFormat): string => {
  switch (format) {
    case DataFormat.JSON:
      return 'application/json';
    case DataFormat.CSV:
      return 'text/csv';
    case DataFormat.XML:
      return 'application/xml';
    case DataFormat.TXT:
      return 'text/plain';
    default:
      return 'text/plain';
  }
};

const getFileExtension = (format: DataFormat): string => {
    return format.toLowerCase();
}

export const downloadData = (content: string, format: DataFormat): void => {
  if (!content) return;

  const mimeType = getMimeType(format);
  const extension = getFileExtension(format);
  const filename = `dummy-data.${extension}`;
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};