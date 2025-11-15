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

// Note: Java-dependent packages (schematron-runner, xslt3, saxon-js) have been removed
// to avoid Java spawn errors in serverless environments. Schematron validation is disabled.

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
    // Note: Schematron validation is disabled in serverless environments (Vercel, AWS Lambda, etc.)
    // because it requires Java runtime which is not available in these environments.
    // Java-dependent packages (schematron-runner, xslt3, saxon-js) have been removed from dependencies.
    if (schematronRules) {
      try {
        // Dynamically import schematronValidator (which will throw an error explaining it's not available)
        const schematronValidatorModule = await import('../../../services/schematronValidator');
        const validateXmlAgainstSchematron = schematronValidatorModule.validateXmlAgainstSchematron;
        
        const schematronValidationResult = await validateXmlAgainstSchematron(xmlString, schematronRules);
        if (!schematronValidationResult.isValid) {
          overallValid = false;
          issues.push(...schematronValidationResult.issues);
        }
      } catch (error) {
        // Schematron validation is not available - add as a warning
        const errorMessage = (error as Error).message;
        issues.push({
          severity: IssueSeverity.Warning,
          message: `Schematron validation skipped: ${errorMessage}`,
        });
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
