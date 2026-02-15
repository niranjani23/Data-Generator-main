import React from 'react';
import { DataFormat } from '../types';

interface DataInputFormProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  format: DataFormat;
  setFormat: (format: DataFormat) => void;
  dateFormat: string;
  setDateFormat: (format: string) => void;
  decimalPlaces: string;
  setDecimalPlaces: (places: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  { label: "User Profiles", text: "10 users with id, name, email, address (city, state), and role (Admin, User)" },
  { label: "E-commerce", text: "5 products with name, price, category, stock count, and isAvailable boolean" },
  { label: "Transactions", text: "List of 5 financial transactions with id, amount, currency, status, and timestamp" },
  { label: "Sensor Data", text: "20 sensor readings with deviceId, temperature, humidity, and timestamp" },
];

const DataInputForm: React.FC<DataInputFormProps> = ({
  prompt,
  setPrompt,
  format,
  setFormat,
  dateFormat,
  setDateFormat,
  decimalPlaces,
  setDecimalPlaces,
  onSubmit,
  isLoading,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-2">
          Data Description
        </label>
        <textarea
          id="prompt"
          rows={4}
          className="w-full bg-slate-800 border border-slate-600 rounded-md p-3 text-brand-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-150 ease-in-out font-mono text-sm"
          placeholder="e.g., 5 products with name, price, and category"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
        />
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 mr-1">Quick Examples:</span>
          {EXAMPLE_PROMPTS.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPrompt(example.text)}
              disabled={isLoading}
              className="text-xs bg-slate-700/50 hover:bg-brand-primary/20 hover:text-brand-primary text-slate-300 border border-slate-600 hover:border-brand-primary/50 py-1 px-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="format" className="block text-sm font-medium text-slate-300 mb-2">
            Output Format
          </label>
          <select
            id="format"
            className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-3 text-brand-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-150 ease-in-out"
            value={format}
            onChange={(e) => setFormat(e.target.value as DataFormat)}
            disabled={isLoading}
          >
            {Object.values(DataFormat).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dateFormat" className="block text-sm font-medium text-slate-300 mb-2">
            Date Format
          </label>
          <select
            id="dateFormat"
            className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-3 text-brand-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-150 ease-in-out"
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            disabled={isLoading}
          >
            <option value="ISO 8601">ISO 8601 (YYYY-MM-DDTHH...)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="Unix Timestamp">Unix Timestamp (ms)</option>
          </select>
        </div>

        <div>
          <label htmlFor="decimalPlaces" className="block text-sm font-medium text-slate-300 mb-2">
            Decimal Precision
          </label>
          <select
            id="decimalPlaces"
            className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-3 text-brand-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-150 ease-in-out"
            value={decimalPlaces}
            onChange={(e) => setDecimalPlaces(e.target.value)}
            disabled={isLoading}
          >
            <option value="default">Auto / Standard</option>
            <option value="0">0 (Integer)</option>
            <option value="1">1 Decimal Place</option>
            <option value="2">2 Decimal Places</option>
            <option value="3">3 Decimal Places</option>
            <option value="4">4 Decimal Places</option>
          </select>
        </div>
      </div>
        
      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-semibold py-3 px-6 rounded-md hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-secondary focus:ring-brand-primary transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Data...
          </>
        ) : (
          'Generate Data'
        )}
      </button>
    </div>
  );
};

export default DataInputForm;