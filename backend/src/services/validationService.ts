// frontend/src/services/validationService.ts

import type { ValidateRequest, ValidateResponse } from '../types';

export async function validateInvoice(request: ValidateRequest): Promise<ValidateResponse> {
  const response = await fetch('/api/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = 'Validation failed';
    try {
      const errorData = await response.json();
      if (typeof errorData.message === 'string' && errorData.message.trim().length > 0) {
        errorMessage = errorData.message;
      }
    } catch (parseError) {
      // Ignore JSON parsing errors and fall back to the default message.
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
