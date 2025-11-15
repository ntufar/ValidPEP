// backend/src/services/schematronValidator.ts

import { Issue, IssueSeverity } from '../types/validation';

// Note: Schematron validation requires Java runtime, which is not available in serverless environments
// (Vercel, AWS Lambda, etc.). This service is disabled in serverless environments.
// To enable Schematron validation, install schematron-runner package and ensure Java is available.

export async function validateXmlAgainstSchematron(
  xmlString: string,
  schematronRules: string
): Promise<{ isValid: boolean; issues: Issue[] }> {
  // Schematron validation is not available in serverless environments
  // since it requires Java runtime which is not available in Vercel/serverless
  throw new Error(
    'Schematron validation unavailable: This feature requires Java runtime, ' +
    'which is not available in serverless environments like Vercel. ' +
    'XSD validation has been completed successfully. ' +
    'To enable Schematron validation, deploy to an environment with Java installed ' +
    'and install the schematron-runner package.'
  );
}

// Define types locally for backward compatibility
export interface IValidationResult {
  assertionId: string;
  description?: string;
  path?: string;
  line?: number;
  test?: string;
  simplifiedTest?: string;
}

