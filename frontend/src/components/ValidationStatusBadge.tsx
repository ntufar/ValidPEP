// frontend/src/components/ValidationStatusBadge.tsx

import React from 'react';

interface ValidationStatusBadgeProps {
  isValid: boolean;
}

const ValidationStatusBadge: React.FC<ValidationStatusBadgeProps> = ({ isValid }) => {
  const bgColor = isValid ? 'bg-green-500' : 'bg-red-500';
  const text = isValid ? 'Valid' : 'Invalid';

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bgColor} text-white`}>
      {text}
    </span>
  );
};

export default ValidationStatusBadge;
