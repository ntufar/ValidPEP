// frontend/src/pages/examples.tsx

import React, { useEffect, useState } from 'react';

interface ExampleFile {
  name: string;
  url: string;
}

const ExamplesPage: React.FC = () => {
  const [exampleFiles, setExampleFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExamples = async () => {
      try {
        const response = await fetch('/api/examples');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const files = await response.json();
        setExampleFiles(files);
      } catch (e) {
        setError(`Failed to fetch example files: ${(e as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchExamples();
  }, []);

  const handleDownload = (filename: string) => {
    const url = `/api/examples?filename=${filename}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return <div className="text-center text-white">Loading example files...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Example Invoices</h1>
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-lg p-6">
        <p className="mb-4 text-gray-300">
          Here you can find example valid PEPPOL BIS Billing invoices in different formats.
          You can download them and use them for testing the validation dashboard.
        </p>
        <ul>
          {exampleFiles.map((filename) => (
            <li key={filename} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
              <span className="text-lg">{filename}</span>
              <button
                onClick={() => handleDownload(filename)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ExamplesPage;
