import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="flex items-center justify-center gap-4 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s-1 1-1 4s1 4 1 4m16-8s1 1 1 4s-1 4-1 4" />
        </svg>
        <h1 className="text-4xl font-bold text-white tracking-tight">AI Dummy Data Generator</h1>
      </div>
      <p className="text-slate-400">
        Describe the data you need, and let AI craft it for you in JSON, CSV, XML, or TXT.
      </p>
    </header>
  );
};

export default Header;