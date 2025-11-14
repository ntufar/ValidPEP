// backend/src/services/schematronValidator.ts

import { type IValidationResult } from 'schematron-runner';
import { Issue, IssueSeverity } from '../types/validation';

// Lazy load schematron-runner to catch Java initialization errors
let schematronRunnerModule: any = null;
async function getSchematronRunner() {
  if (!schematronRunnerModule) {
    try {
      schematronRunnerModule = await import('schematron-runner');
    } catch (error) {
      const errorMessage = (error as Error).message;
      const errorCode = (error as any)?.code;
      const errorSyscall = (error as any)?.syscall;
      
      // If Java is not available, throw a more descriptive error
      if (
        errorCode === 'ENOENT' ||
        errorSyscall === 'spawn javac' ||
        errorMessage.includes('spawn javac') ||
        errorMessage.includes('javac')
      ) {
        throw new Error(
          'Schematron validation unavailable: Java runtime not available in this environment. ' +
          'This is common in serverless environments like Vercel. ' +
          'XSD validation will continue, but Schematron rules cannot be applied without a Java runtime.'
        );
      }
      throw error;
    }
  }
  return schematronRunnerModule;
}

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

// Type for completed validation - will be inferred from the actual validation call
type CompletedValidation = {
  errors: IValidationResult[];
  warnings: IValidationResult[];
  ignored: Array<{
    assertionId: string;
    errorMessage: string | Array<{ errorMessage: string }> | { errorMessage: string };
    test?: string;
    simplifiedTest?: string;
  }>;
};
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
    // Lazy load schematron-runner module
    const schematronModule = await getSchematronRunner();
    const runSchematronValidate = schematronModule.validate || schematronModule.default?.validate || schematronModule.default;
    
    if (typeof runSchematronValidate !== 'function') {
      throw new Error('Failed to load Schematron validator: validate function not found');
    }
    
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
    const errorMessage = (error as Error).message;
    const errorCode = (error as any)?.code;
    const errorSyscall = (error as any)?.syscall;

    // Handle Java-related errors (ENOENT for javac, Java not found, etc.)
    // These occur in serverless environments where Java is not available
    if (
      errorCode === 'ENOENT' ||
      errorSyscall === 'spawn javac' ||
      errorMessage.includes('spawn javac') ||
      errorMessage.includes('javac') ||
      errorMessage.includes('Java') ||
      errorMessage.includes('java')
    ) {
      throw new Error(
        `Schematron validation unavailable: Java runtime not available in this environment. ` +
        `This is common in serverless environments like Vercel. ` +
        `XSD validation will continue, but Schematron rules cannot be applied without a Java runtime.`
      );
    }

    // Provide more context for XPath parsing errors
    // These will be caught by the route handler and converted to warnings
    if (errorMessage.includes('XPath') || errorMessage.includes('xpath') || errorMessage.includes('parse error')) {
      throw new Error(
        `Failed to validate XML against Schematron: ${errorMessage}. ` +
        `This may be due to unsupported XPath expressions in the Schematron rules. ` +
        `The Schematron file uses XPath 2.0 (xslt2 query binding), which may not be fully supported.`
      );
    }

    throw new Error(`Failed to validate XML against Schematron: ${errorMessage}`);
  }
}
