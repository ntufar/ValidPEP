// backend/src/services/schematronValidator.ts

import { validate as runSchematronValidate, type IValidationResult } from 'schematron-runner';
import { Issue, IssueSeverity } from '../types/validation';

function mapValidationResult(entry: IValidationResult, severity: IssueSeverity): Issue {
  const message = entry.description?.trim().length
    ? entry.description
    : `Schematron ${severity === IssueSeverity.Error ? 'error' : 'warning'} (assertion ${entry.assertionId})`;

  return {
    severity,
    code: entry.assertionId,
    message,
    xpath: entry.path || undefined,
    lineNumber: entry.line ?? undefined,
    suggestion: entry.simplifiedTest ?? entry.test ?? undefined,
  };
}

type CompletedValidation = Awaited<ReturnType<typeof runSchematronValidate>>;
type IgnoredResult = CompletedValidation['ignored'][number];

function formatIgnoredMessage(message: IgnoredResult['errorMessage']): string {
  if (Array.isArray(message)) {
    return message.map(item => item.errorMessage).join('; ');
  }
  if (typeof message === 'object' && message !== null && 'errorMessage' in message) {
    return message.errorMessage;
  }
  return String(message);
}

function mapIgnoredResult(entry: IgnoredResult): Issue {
  const rawMessage = formatIgnoredMessage(entry.errorMessage);

  return {
    severity: IssueSeverity.Info,
    code: entry.assertionId,
    message: `Schematron assertion skipped: ${rawMessage}`,
    xpath: undefined,
    suggestion: entry.simplifiedTest ?? entry.test ?? undefined,
  };
}

export async function validateXmlAgainstSchematron(
  xmlString: string,
  schematronRules: string
): Promise<{ isValid: boolean; issues: Issue[] }> {
  try {
    const validation = await runSchematronValidate(xmlString, schematronRules);
    const issues: Issue[] = [];

    for (const error of validation.errors) {
      issues.push(mapValidationResult(error, IssueSeverity.Error));
    }

    for (const warning of validation.warnings) {
      issues.push(mapValidationResult(warning, IssueSeverity.Warning));
    }

    for (const ignored of validation.ignored) {
      issues.push(mapIgnoredResult(ignored));
    }

    const isValid = validation.errors.length === 0;
    return { isValid, issues };
  } catch (error) {
    console.error('Schematron validation error:', error);
    throw new Error('Failed to validate XML against Schematron: ' + (error as Error).message);
  }
}
