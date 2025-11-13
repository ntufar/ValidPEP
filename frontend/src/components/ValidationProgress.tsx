// frontend/src/components/ValidationProgress.tsx

import React from 'react';
import { ValidationStatus } from '../types/validation';

interface ValidationProgressProps {
  status: ValidationStatus;
  message?: string;
}

const statusMessages: Record<ValidationStatus, string> = {
  [ValidationStatus.Uploading]: 'Uploading file...',
  [ValidationStatus.Parsing]: 'Parsing XML...',
  [ValidationStatus.ValidatingSchema]: 'Validating against XSD schema...',
  [ValidationStatus.ValidatingSchematron]: 'Applying Schematron rules...',
  [ValidationStatus.Validated]: 'Validation complete: Valid!',
  [ValidationStatus.Invalid]: 'Validation complete: Invalid!',
};

const ValidationProgress: React.FC<ValidationProgressProps> = ({ status, message }) => {
  const displayMessage = message || statusMessages[status];

  const getStatusColor = (currentStatus: ValidationStatus) => {
    switch (currentStatus) {
      case ValidationStatus.Validated:
        return 'text-green-500';
      case ValidationStatus.Invalid:
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-center">Validation Progress</h2>
      <div className="flex items-center justify-center space-x-4">
        <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-in-out
              ${status === ValidationStatus.Uploading && 'w-1/6 bg-blue-500'}
              ${status === ValidationStatus.Parsing && 'w-2/6 bg-blue-500'}
              ${status === ValidationStatus.ValidatingSchema && 'w-3/6 bg-blue-500'}
              ${status === ValidationStatus.ValidatingSchematron && 'w-4/6 bg-blue-500'}
              ${status === ValidationStatus.Validated && 'w-full bg-green-500'}
              ${status === ValidationStatus.Invalid && 'w-full bg-red-500'}
            `}
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
