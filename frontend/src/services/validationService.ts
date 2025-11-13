// frontend/src/services/validationService.ts

import { ValidateRequest, ValidateResponse } from '../types/validation';

export async function validateInvoice(request: ValidateRequest): Promise<ValidateResponse> {
  const response = await fetch('/api/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Validation failed');
  }

  return response.json();
}
