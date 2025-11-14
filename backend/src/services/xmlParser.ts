// backend/src/services/xmlParser.ts

import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { Issue, IssueSeverity } from '../types/validation';

// Dynamic import for xsd-schema-validator to avoid Turbopack build issues
let xsdValidator: any;
async function getXsdValidator() {
  if (!xsdValidator) {
    xsdValidator = await import('xsd-schema-validator');
  }
  return xsdValidator;
}

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
  try {
    // Convert DOM Document to XML string for xsd-schema-validator
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(xmlDoc);

    // Dynamically import xsd-schema-validator
    const validatorModule = await getXsdValidator();
    
    // For now, we'll use xsd-schema-validator which is a pure JS solution
    // Note: This library has limitations with complex XSD schemas and external imports
    // The package uses CommonJS: module.exports.validateXML
    return new Promise<{ isValid: boolean; issues: Issue[] }>((resolve, reject) => {
      // Handle CommonJS export (might be wrapped in default or direct)
      const validator = validatorModule.default || validatorModule;
      const validateXML = validator?.validateXML || validator;
      
      if (typeof validateXML !== 'function') {
        reject(new Error('Failed to load XSD validator: validateXML function not found'));
        return;
      }
      validateXML(xmlString, xsdSchema, (err: any, result: any) => {
        if (err) {
          // Check if it's a schema parsing issue (external imports, etc.)
          const errorMessage = err.message || String(err);
          if (
            errorMessage.includes('import') ||
            errorMessage.includes('include') ||
            errorMessage.includes('schemaLocation') ||
            errorMessage.includes('Invalid') ||
            errorMessage.includes('external') ||
            errorMessage.includes('unresolved')
          ) {
            reject(
              new Error(
                `Failed to parse XSD schema: ${errorMessage}. ` +
                  `This may be due to unresolved external schema imports. ` +
                  `The XSD schema contains external references that cannot be resolved. ` +
                  `Ensure network access is available or provide all required schema files locally.`
              )
            );
            return;
          }
          reject(new Error(`Failed to validate XML against XSD: ${errorMessage}`));
          return;
        }

        if (!result || !result.valid) {
          const issues: Issue[] = (result?.errors || []).map((err: any) => ({
            severity: IssueSeverity.Error,
            message: err.message || String(err),
            lineNumber: err.line !== undefined ? parseInt(String(err.line)) : undefined,
            xpath: err.path || undefined,
          }));
          resolve({ isValid: false, issues });
        } else {
          resolve({ isValid: true, issues: [] });
        }
      });
    });
  } catch (error) {
    // Error will be caught and handled by the route handler
    // which will convert known issues (external imports, etc.) to warnings
    const errorMessage = (error as Error).message;
    if (
      errorMessage.includes('Invalid XSD schema') ||
      errorMessage.includes('Invalid schema') ||
      errorMessage.includes('external') ||
      errorMessage.includes('import') ||
      errorMessage.includes('unresolved')
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
}
