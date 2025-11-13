// frontend/src/components/ValidationOptions.tsx

import React from 'react';

interface ValidationOptionsProps {
  selectedCountry: string;
  onCountryChange: (country: string) => void;
}

const countries = [
  { code: 'auto', name: 'Auto-detect' },
  { code: 'NO', name: 'Norway' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'DE', name: 'Germany' },
];

const ValidationOptions: React.FC<ValidationOptionsProps> = ({ selectedCountry, onCountryChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="country-select" className="text-gray-300 text-sm">Country:</label>
      <select
        id="country-select"
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value)}
        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5"
      >
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ValidationOptions;
