// frontend/src/utils/certificateGenerator.ts

import { ValidateResponse } from '../../backend/src/types/validation'; // Adjust path as needed

export function generateValidationCertificate(validationResult: ValidateResponse): string {
  // This is a placeholder function.
  // In a real application, this would generate a more formal certificate,
  // possibly a PDF or a signed document.
  const status = validationResult.valid ? 'VALID' : 'INVALID';
  const date = new Date(validationResult.timestamp).toLocaleString();

  return `
    --- PEPPOL BIS Billing Validation Certificate ---

    Validation Status: ${status}
    Format: ${validationResult.format.toUpperCase()}
    Version: ${validationResult.version}
    Country: ${validationResult.country || 'N/A'}
    Validation Date: ${date}

    Total Errors: ${validationResult.statistics.errorCount}
    Total Warnings: ${validationResult.statistics.warningCount}

    --- End of Certificate ---
  `;
}
