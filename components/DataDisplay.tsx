
import React, { useState, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { DataFormat } from '../types';
import { downloadData } from '../utils/fileUtils';

interface DataDisplayProps {
  data: string;
  isLoading: boolean;
  format: DataFormat;
}

const DataDisplay: React.FC<DataDisplayProps> = ({ data, isLoading, format }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  const handleDownload = () => {
    downloadData(data, format);
  };
  
  const handleCopy = useCallback(() => {
    if (!data) return;
    navigator.clipboard.writeText(data).then(() => {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  }, [data]);

  if (isLoading && !data) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return (
        <div className="mt-6 flex flex-col items-center justify-center h-64 bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-lg text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-semibold">Your generated data will appear here.</p>
            <p className="text-sm">Enter a description above and click "Generate Data".</p>
        </div>
    );
  }

  const lines = data.split('\n');
  const isTruncated = lines.length > 50;
  const displayData = isTruncated ? lines.slice(0, 50).join('\n') : data;
  const remainingLines = lines.length - 50;


  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-white">Generated Output</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={isCopied}
            className="flex items-center gap-2 bg-slate-700 text-white text-sm font-medium py-1.5 px-4 rounded-md hover:bg-slate-600 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-wait"
          >
            {isCopied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-slate-600 text-white text-sm font-medium py-1.5 px-4 rounded-md hover:bg-slate-500 transition duration-150 ease-in-out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download .{format.toLowerCase()}
          </button>
        </div>
      </div>
      <div className="relative">
        <div className="bg-brand-dark rounded-md p-4 max-h-96 overflow-auto">
          <pre className="text-sm text-brand-light font-mono whitespace-pre-wrap">
            <code>{displayData}</code>
          </pre>
        </div>
        {isTruncated && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-brand-dark to-transparent pointer-events-none" aria-hidden="true"></div>
        )}
      </div>
      {isTruncated && (
        <p className="text-center text-sm text-slate-400 mt-2" aria-live="polite">
          Displaying first 50 lines. {remainingLines} more line{remainingLines > 1 ? 's' : ''} available in the full file.
        </p>
      )}
    </div>
  );
};

export default DataDisplay;
