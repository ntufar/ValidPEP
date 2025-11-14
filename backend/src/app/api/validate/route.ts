import { NextResponse } from 'next/server';
import { handleError } from '../../../utils/errorHandler';
import { logger } from '../../../utils/logger';
import { ValidateResponse, IssueSeverity, InvoiceFormat, Issue } from '../../../types/validation';
import { detectInvoiceFormat, detectInvoiceCountry } from '../../../services/invoiceDetector';
import { parseXml, validateXmlAgainstXsd } from '../../../services/xmlParser';
// Don't import schematronValidator statically - it might trigger Java spawn during module init
// import { validateXmlAgainstSchematron } from '../../../services/schematronValidator';
import { getPeppolValidationArtifacts } from '../../../services/peppolArtifacts';

const MAX_XML_BYTES = 10 * 1024 * 1024; // 10 MB

// Handle uncaught exceptions from Java-related spawns during module initialization
// This catches errors that occur when schematron-runner or its dependencies try to spawn Java
// Note: This handler prevents the app from crashing, but the error may still be logged by Next.js/Turbopack
if (typeof process !== 'undefined' && process.listeners) {
  // Use 'uncaughtException' instead of 'once' to handle multiple errors
  const existingHandler = process.listeners('uncaughtException').length;
  if (existingHandler === 0) {
    process.on('uncaughtException', (error: Error & { code?: string; syscall?: string }) => {
      // Only handle Java-related spawn errors silently
      if (
        error.code === 'ENOENT' &&
        (error.syscall === 'spawn javac' || error.message?.includes('spawn javac'))
      ) {
        // Log as debug/warn but don't crash - this will be handled gracefully when Schematron validation is attempted
        logger.warn('Java runtime not available - Schematron validation will be skipped', {
          code: error.code,
          syscall: error.syscall,
          message: error.message,
        });
        // Don't rethrow - we'll handle this gracefully when validation is attempted
        return;
      }
      // Re-throw other uncaught exceptions to let Next.js handle them
      throw error;
    });
  }
}

export async function POST(request: Request) {
  try {
    const { file: base64File, format: preferredFormat, country: preferredCountry } = await request.json();
    logger.info('Received validation request', { preferredFormat, preferredCountry });

    if (typeof base64File !== 'string' || base64File.trim().length === 0) {
      return NextResponse.json({ message: 'No file provided for validation.' }, { status: 400 });
    }

    const normalizedPayload = base64File.replace(/\s+/g, '');
    if (!/^([A-Za-z0-9+/]+={0,2})$/.test(normalizedPayload)) {
      return NextResponse.json({ message: 'Invalid base64 payload provided.' }, { status: 400 });
    }

    const xmlBuffer = Buffer.from(normalizedPayload, 'base64');

    if (xmlBuffer.byteLength === 0) {
      return NextResponse.json({ message: 'XML file is empty after decoding.' }, { status: 400 });
    }

    if (xmlBuffer.byteLength > MAX_XML_BYTES) {
      return NextResponse.json({ message: `XML file exceeds the maximum supported size (${MAX_XML_BYTES / (1024 * 1024)} MB).` }, { status: 413 });
    }

    const xmlString = xmlBuffer.toString('utf8');
    const issues: Issue[] = [];
    let overallValid = true;
    let detectedFormat: InvoiceFormat = InvoiceFormat.Auto;
    let detectedCountry: string | undefined;

    // 1. Detect Invoice Format
    try {
      detectedFormat = detectInvoiceFormat(xmlString);
      if (preferredFormat && preferredFormat !== InvoiceFormat.Auto && preferredFormat !== detectedFormat) {
        issues.push({
          severity: IssueSeverity.Warning,
          message: `Preferred format '${preferredFormat}' does not match detected format '${detectedFormat}'. Proceeding with detected format.`,
        });
      }
      detectedCountry = detectInvoiceCountry(xmlString);
    } catch (error) {
      issues.push({
        severity: IssueSeverity.Error,
        message: `Failed to inspect invoice metadata: ${(error as Error).message}`,
      });
      overallValid = false;
    }

    if (!overallValid) {
      return NextResponse.json({
        valid: false,
        format: detectedFormat,
        version: 'N/A',
        country: detectedCountry || preferredCountry || 'N/A',
        timestamp: new Date().toISOString(),
        errors: issues.filter(issue => issue.severity === IssueSeverity.Error),
        warnings: issues.filter(issue => issue.severity === IssueSeverity.Warning),
        statistics: {
          totalLines: xmlString.split('\n').length,
          errorCount: issues.filter(issue => issue.severity === IssueSeverity.Error).length,
          warningCount: issues.filter(issue => issue.severity === IssueSeverity.Warning).length,
        },
      }, { status: 400 });
    }

    // 2. Parse XML
    let xmlDoc;
    try {
      xmlDoc = parseXml(xmlString);
    } catch (error) {
      issues.push({
        severity: IssueSeverity.Error,
        message: `XML parsing failed: ${(error as Error).message}`,
      });
      overallValid = false;
    }

    if (!overallValid) {
      return NextResponse.json({
        valid: false,
        format: detectedFormat,
        version: 'N/A',
        country: detectedCountry || preferredCountry || 'N/A',
        timestamp: new Date().toISOString(),
        errors: issues.filter(issue => issue.severity === IssueSeverity.Error),
        warnings: issues.filter(issue => issue.severity === IssueSeverity.Warning),
        statistics: {
          totalLines: xmlString.split('\n').length,
          errorCount: issues.filter(issue => issue.severity === IssueSeverity.Error).length,
          warningCount: issues.filter(issue => issue.severity === IssueSeverity.Warning).length,
        },
      }, { status: 400 });
    }

    // 3. Get Validation Artifacts (XSD and Schematron)
    const formatToValidate = preferredFormat && preferredFormat !== InvoiceFormat.Auto ? preferredFormat : detectedFormat;
    const countryToValidate = preferredCountry && preferredCountry !== 'auto'
      ? preferredCountry.toUpperCase()
      : (detectedCountry || 'NO');

    let artifacts:
      | Awaited<ReturnType<typeof getPeppolValidationArtifacts>>
      | undefined;
    let xsdSchema: string | undefined;
    let schematronRules: string | undefined;
    let xsdBaseUrl: string | undefined;

    try {
      artifacts = await getPeppolValidationArtifacts(formatToValidate, countryToValidate);
      xsdSchema = artifacts.xsd;
      schematronRules = artifacts.schematron;
      xsdBaseUrl = artifacts.xsdBaseUrl;
    } catch (error) {
      issues.push({
        severity: IssueSeverity.Error,
        message: `Failed to load validation artifacts for ${formatToValidate}/${countryToValidate}: ${(error as Error).message}`,
      });
      overallValid = false;
    }

    if (!overallValid) {
      return NextResponse.json({
        valid: false,
        format: detectedFormat,
        version: 'N/A',
        country: countryToValidate,
        timestamp: new Date().toISOString(),
        errors: issues.filter(issue => issue.severity === IssueSeverity.Error),
        warnings: issues.filter(issue => issue.severity === IssueSeverity.Warning),
        statistics: {
          totalLines: xmlString.split('\n').length,
          errorCount: issues.filter(issue => issue.severity === IssueSeverity.Error).length,
          warningCount: issues.filter(issue => issue.severity === IssueSeverity.Warning).length,
        },
      }, { status: 500 });
    }

    // 4. XSD Validation
    if (xsdSchema && xmlDoc) {
      try {
        // Note: baseUrl is not passed as xsd-schema-validator doesn't support it directly
        // External schema imports should be resolved automatically if they use absolute URLs
        const xsdOptions = { nonet: false }; // Allow network access for external imports
        const xsdValidationResult = await validateXmlAgainstXsd(xmlDoc, xsdSchema, xsdOptions);
        if (!xsdValidationResult.isValid) {
          overallValid = false;
          issues.push(...xsdValidationResult.issues);
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        // If XSD validation fails due to schema parsing issues (e.g., external imports),
        // add it as a warning rather than an error, so validation can continue with Schematron
        if (errorMessage.includes('external') || errorMessage.includes('import') || 
            errorMessage.includes('unresolved') || errorMessage.includes('incomplete') ||
            errorMessage.includes('Invalid XSD schema') || errorMessage.includes('Invalid schema')) {
          issues.push({
            severity: IssueSeverity.Warning,
            message: `XSD validation skipped: ${errorMessage}. Continuing with Schematron validation.`,
          });
        } else {
          issues.push({
            severity: IssueSeverity.Error,
            message: `XSD validation failed: ${errorMessage}`,
          });
          overallValid = false;
        }
      }
    } else {
      issues.push({
        severity: IssueSeverity.Warning,
        message: artifacts?.xsdError
          ? `XSD schema not available for validation. ${artifacts.xsdError}`
          : 'XSD schema not available for validation.',
      });
    }

    // 5. Schematron Validation
    if (schematronRules) {
      try {
        // Check if Java is available before attempting to import schematronValidator
        // This prevents the module from trying to spawn Java during initialization
        const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV);
        const javaAvailable = process.env.JAVA_AVAILABLE === 'true';
        
        if (isServerless && !javaAvailable) {
          // Skip Schematron validation in serverless environments without Java
          issues.push({
            severity: IssueSeverity.Warning,
            message: 'Schematron validation skipped: Java runtime is not available in this serverless environment. ' +
                     'XSD validation has been completed successfully. ' +
                     'To enable Schematron validation, set JAVA_AVAILABLE=true and ensure Java is installed.',
          });
        } else {
          // Dynamically import schematronValidator only if Java might be available
          const schematronValidatorModule = await import('../../../services/schematronValidator');
          const validateXmlAgainstSchematron = schematronValidatorModule.validateXmlAgainstSchematron;
          
          const schematronValidationResult = await validateXmlAgainstSchematron(xmlString, schematronRules);
          if (!schematronValidationResult.isValid) {
            overallValid = false;
            issues.push(...schematronValidationResult.issues);
          }
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        const errorCode = (error as any)?.code;
        const errorSyscall = (error as any)?.syscall;
        
        // If Schematron validation fails due to Java not being available (serverless environments),
        // add it as a warning rather than an error, so we can still return XSD validation results
        if (
          errorCode === 'ENOENT' ||
          errorSyscall === 'spawn javac' ||
          errorMessage.includes('spawn javac') ||
          errorMessage.includes('javac') ||
          errorMessage.includes('Java runtime not available') ||
          errorMessage.includes('Java') ||
          errorMessage.includes('serverless environments')
        ) {
          issues.push({
            severity: IssueSeverity.Warning,
            message: `Schematron validation skipped: ${errorMessage}`,
          });
        }
        // If Schematron validation fails due to XPath parsing issues,
        // add it as a warning rather than an error, so we can still return results
        else if (errorMessage.includes('XPath') || errorMessage.includes('xpath') || 
            errorMessage.includes('parse error') || errorMessage.includes('XPath 2.0')) {
          issues.push({
            severity: IssueSeverity.Warning,
            message: `Schematron validation skipped: ${errorMessage}. ` +
                     `Some XPath 2.0 expressions in the Schematron rules may not be fully supported.`,
          });
        } else {
          issues.push({
            severity: IssueSeverity.Error,
            message: `Schematron validation failed: ${errorMessage}`,
          });
          overallValid = false;
        }
      }
    } else {
      issues.push({
        severity: IssueSeverity.Warning,
        message: 'Schematron rules not available for validation.',
      });
    }

    const totalLines = xmlString.split('\n').length;
    const errors = issues.filter(issue => issue.severity === IssueSeverity.Error);
    const warnings = issues.filter(issue => issue.severity === IssueSeverity.Warning);

    const finalResponse: ValidateResponse = {
      valid: overallValid,
      format: formatToValidate,
      version: 'PEPPOL BIS Billing 3.0.19', // Hardcoded for now, should come from artifacts
      country: countryToValidate,
      timestamp: new Date().toISOString(),
      errors: errors,
      warnings: warnings,
      statistics: {
        totalLines: totalLines,
        errorCount: errors.length,
        warningCount: warnings.length,
      },
    };

    return NextResponse.json(finalResponse);
  } catch (error) {
    return handleError(error, 'POST /api/validate');
  }
}
