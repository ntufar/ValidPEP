// frontend/src/components/ValidationProgress.tsx

import React from 'react';
import type { ValidationStatus } from '../types';

interface ValidationProgressProps {
  status: ValidationStatus;
  message?: string;
}

const statusMessages: Record<ValidationStatus, string> = {
  Uploading: 'Uploading file...',
  Parsing: 'Parsing XML...',
  Validating: 'Running validation...',
  Validating_Schema: 'Validating against XSD schema...',
  Validating_Schematron: 'Applying Schematron rules...',
  Validated: 'Validation complete: Valid!',
  Invalid: 'Validation complete: Invalid!',
};

const ValidationProgress: React.FC<ValidationProgressProps> = ({ status, message }) => {
  const displayMessage = message || statusMessages[status];

  const getStatusColor = (currentStatus: ValidationStatus) => {
    switch (currentStatus) {
      case 'Validated':
        return 'text-green-500';
      case 'Invalid':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  const progressMap: Partial<Record<ValidationStatus, number>> = {
    Uploading: 16,
    Parsing: 33,
    Validating: 66,
    Validating_Schema: 66,
    Validating_Schematron: 83,
    Validated: 100,
    Invalid: 100,
  };

  const progress = progressMap[status] ?? 16;

  return (
    <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-center">Validation Progress</h2>
      <div className="flex items-center justify-center space-x-4">
        <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-in-out ${
              status === 'Validated'
                ? 'bg-green-500'
                : status === 'Invalid'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      <p className={`mt-4 text-center text-lg font-medium ${getStatusColor(status)}`}>
        {displayMessage}
      </p>
    </div>
  );
};

export default ValidationProgress;
