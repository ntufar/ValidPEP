// frontend/src/components/ValidationActions.tsx

import React from 'react';
import { ValidateResponse } from '../types/validation';
import { generateValidationCertificate } from '../utils/certificateGenerator';

interface ValidationActionsProps {
  validationResult: ValidateResponse;
}

const ValidationActions: React.FC<ValidationActionsProps> = ({ validationResult }) => {
  const handleDownloadCertificate = () => {
    const certificateContent = generateValidationCertificate(validationResult);
    const blob = new Blob([certificateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-certificate-${validationResult.timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 flex justify-center space-x-4">
      {validationResult.valid && (
        <button
          onClick={handleDownloadCertificate}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
        >
          Download Certificate
        </button>
      )}
      {/* TODO: Add other actions like download JSON/HTML report */}
    </div>
  );
};

export default ValidationActions;
