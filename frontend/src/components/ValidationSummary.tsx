// frontend/src/components/ValidationSummary.tsx

import React from 'react';

interface ValidationSummaryProps {
  errorCount: number;
  warningCount: number;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({ errorCount, warningCount }) => {
  return (
    <div className="flex justify-center space-x-4 mt-4">
      <div className="p-3 bg-gray-700 rounded-lg text-center">
        <p className="text-lg font-semibold text-red-400">{errorCount}</p>
        <p className="text-sm text-gray-400">Errors</p>
      </div>
      <div className="p-3 bg-gray-700 rounded-lg text-center">
        <p className="text-lg font-semibold text-yellow-400">{warningCount}</p>
        <p className="text-sm text-gray-400">Warnings</p>
      </div>
    </div>
  );
};

export default ValidationSummary;
