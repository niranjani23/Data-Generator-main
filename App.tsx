import React, { useState, useCallback } from 'react';
import { DataFormat } from './types';
import Header from './components/Header';
import DataInputForm from './components/DataInputForm';
import DataDisplay from './components/DataDisplay';
import ErrorAlert from './components/ErrorAlert';
import { generateDummyData } from './services/geminiService';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('10 users with a name, email, address, and a unique ID from 1 to 10');
  const [format, setFormat] = useState<DataFormat>(DataFormat.JSON);
  const [dateFormat, setDateFormat] = useState<string>('ISO 8601');
  const [decimalPlaces, setDecimalPlaces] = useState<string>('default');
  
  const [generatedData, setGeneratedData] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for the data you want to generate.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedData('');

    try {
      await generateDummyData(
        prompt, 
        format, 
        { dateFormat, decimalPlaces },
        (chunk) => {
          setGeneratedData((prevData) => prevData + chunk);
        }
      );
    } catch (err) {
      console.error(err);
      setError('Failed to generate data. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, format, dateFormat, decimalPlaces]);

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light font-sans">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Header />
        <main className="mt-8 p-6 bg-brand-secondary rounded-lg shadow-lg">
          <DataInputForm
            prompt={prompt}
            setPrompt={setPrompt}
            format={format}
            setFormat={setFormat}
            dateFormat={dateFormat}
            setDateFormat={setDateFormat}
            decimalPlaces={decimalPlaces}
            setDecimalPlaces={setDecimalPlaces}
            onSubmit={handleGenerate}
            isLoading={isLoading}
          />
          {error && <ErrorAlert message={error} />}
          <DataDisplay 
            data={generatedData}
            isLoading={isLoading}
            format={format}
          />
        </main>
        <footer className="text-center mt-8 text-slate-500 text-sm">
          <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;