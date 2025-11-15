// backend/src/services/xmlParser.ts

import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { Issue, IssueSeverity } from '../types/validation';
import { XmlHelper } from 'xml-helper-ts';

// Export a type that matches what invoiceDetector expects (DOMDocument)
export type XmlDocument = Document;

export function parseXml(xmlString: string): Document {
  try {
    const parser = new DOMParser({
      locator: {},
      errorHandler: {
        warning: (w) => console.warn('XML parser warning:', w),
        error: (e) => {
          throw new Error(`XML parsing error: ${e}`);
        },
        fatalError: (e) => {
          throw new Error(`XML parsing fatal error: ${e}`);
        },
      },
    });
    const doc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parserError = doc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      const errorText = parserError[0].textContent || 'Unknown parsing error';
      throw new Error(`Failed to parse XML: ${errorText}`);
    }
    
    return doc;
  } catch (error) {
    console.error('XML parsing error:', error);
    throw new Error('Failed to parse XML: ' + (error as Error).message);
  }
}

export type XmlParserOptions = {
  nonet?: boolean;
  baseUrl?: string;
};

export async function validateXmlAgainstXsd(
  xmlDoc: Document,
  xsdSchema: string,
  parserOptions: XmlParserOptions = {}
): Promise<{ isValid: boolean; issues: Issue[] }> {
  // TEMPORARY: Skip XSD validation because xml-helper-ts hangs on schemas with external imports
  // The UBL and CII XSD schemas contain xsd:import statements that xml-helper-ts tries to resolve
  // synchronously, causing the process to hang indefinitely.
  // 
  // TODO: Find a better XSD validation library that:
  // 1. Handles external schema imports properly
  // 2. Doesn't require Java
  // 3. Works in serverless environments
  // 
  // For now, we skip XSD validation and return a warning
  console.warn('[xmlParser] XSD validation skipped - xml-helper-ts cannot handle external schema imports');
  
  throw new Error(
    'XSD validation is temporarily disabled. ' +
    'The xml-helper-ts library cannot handle XSD schemas with external imports (xsd:import/xsd:include). ' +
    'The PEPPOL UBL and CII schemas contain external imports that cause the validator to hang. ' +
    'XML structure validation and Schematron validation will still be performed.'
  );
  
  /* Original implementation - disabled due to hanging issue
  try {
    console.log('[xmlParser] Starting XSD validation', { xsdSchemaLength: xsdSchema.length });
    
    // Convert DOM Document to XML string for validation
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(xmlDoc);
    console.log('[xmlParser] XML serialized', { xmlLength: xmlString.length });

    // Use xml-helper-ts for XSD validation (pure JavaScript, no Java dependencies)
    const xmlHelper = new XmlHelper();
    console.log('[xmlParser] XmlHelper created');
    
    // Load the XSD schema - THIS HANGS ON EXTERNAL IMPORTS
    console.log('[xmlParser] Loading XSD schema...');
    const schemaErrors = xmlHelper.loadSchema(xsdSchema);
    console.log('[xmlParser] Schema loaded', { errorCount: schemaErrors.length });
        
        if (schemaErrors.length > 0) {
          // If schema loading fails, convert errors to issues
          const issues: Issue[] = schemaErrors.map((err) => ({
            severity: IssueSeverity.Error,
            message: `XSD schema error: ${err.message}`,
            lineNumber: err.line,
            xpath: undefined,
          }));
          
          // Check if it's a schema parsing issue (external imports, etc.)
          const hasExternalImportError = schemaErrors.some(
            (err) =>
              err.message.includes('import') ||
              err.message.includes('include') ||
              err.message.includes('schemaLocation') ||
              err.message.includes('external') ||
              err.message.includes('unresolved')
          );
          
          if (hasExternalImportError) {
            throw new Error(
              `Failed to parse XSD schema: ${schemaErrors.map((e) => e.message).join('; ')}. ` +
                `This may be due to unresolved external schema imports. ` +
                `The XSD schema contains external references that cannot be resolved. ` +
                `Ensure network access is available or provide all required schema files locally.`
            );
          }
          
          return { isValid: false, issues };
        }
        
        // Validate XML against the loaded schema
        console.log('[xmlParser] Validating XML against schema...');
        const validationErrors = xmlHelper.validateXml(xmlString);
        console.log('[xmlParser] Validation completed', { errorCount: validationErrors.length });
        
        if (validationErrors.length === 0) {
          return { isValid: true, issues: [] };
        }
        
        // Convert validation errors to issues
        const issues: Issue[] = validationErrors.map((err) => ({
          severity: IssueSeverity.Error,
          message: err.message,
          lineNumber: err.line,
          xpath: undefined, // xml-helper-ts doesn't provide XPath, but provides line numbers
        }));
        
        return { isValid: false, issues };
      } catch (error) {
        // Error will be caught and handled by the route handler
        // which will convert known issues (external imports, etc.) to warnings
        const errorMessage = (error as Error).message;
        
        if (
          errorMessage.includes('Invalid XSD schema') ||
          errorMessage.includes('Invalid schema') ||
          errorMessage.includes('external') ||
          errorMessage.includes('import') ||
          errorMessage.includes('unresolved') ||
          errorMessage.includes('Failed to parse XSD schema')
        ) {
          throw new Error(
            `XSD schema is invalid or incomplete: ${errorMessage}. ` +
              `This is likely due to unresolved external schema imports. ` +
              `The XSD schema contains external references (xsd:import or xsd:include) ` +
              `that cannot be resolved automatically. ` +
              `All required schema files must be available locally or accessible via network.`
          );
        }
        throw new Error(`Failed to validate XML against XSD: ${errorMessage}`);
      }
  */
}
