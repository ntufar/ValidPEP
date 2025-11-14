// backend/src/services/xmlParser.ts

import libxmljs2 from 'libxmljs2';
import { Issue, IssueSeverity } from '../types/validation';

export function parseXml(xmlString: string) {
  try {
    return libxmljs2.parseXml(xmlString);
  } catch (error) {
    console.error('XML parsing error:', error);
    throw new Error('Failed to parse XML: ' + (error as Error).message);
  }
}

type XmlParserOptions = Parameters<typeof libxmljs2.parseXml>[1] extends undefined
  ? Record<string, never>
  : NonNullable<Parameters<typeof libxmljs2.parseXml>[1]>;

export function validateXmlAgainstXsd(
  xmlDoc: libxmljs2.Document,
  xsdSchema: string,
  parserOptions: XmlParserOptions = {}
): { isValid: boolean; issues: Issue[] } {
  try {
    // Parse XSD schema with options that allow network access for external imports
    // Note: libxmljs2 doesn't support 'baseUrl' option directly, but it should
    // be able to resolve external imports if network access is enabled (nonet: false)
    const xsdParseOptions: any = {
      nonet: false, // Allow network access for external schema imports
    };
    
    // Only include supported libxmljs2 options
    // baseUrl is not a standard libxmljs2 option, so we don't pass it
    // External imports should be resolved automatically if they use absolute URLs

    let xsdDoc: libxmljs2.Document;
    try {
      xsdDoc = libxmljs2.parseXml(xsdSchema, xsdParseOptions);
    } catch (parseError) {
      const errorMessage = (parseError as Error).message;
      console.error('XSD schema parsing failed:', {
        error: errorMessage,
        errorName: (parseError as Error).name,
        hasBaseUrl: !!parserOptions.baseUrl,
        baseUrl: parserOptions.baseUrl,
      });
      
      // If parsing fails, it might be due to external imports that can't be resolved
      // Provide a more helpful error message
      if (errorMessage.includes('import') || errorMessage.includes('include') || 
          errorMessage.includes('schemaLocation') || errorMessage.includes('Invalid')) {
        throw new Error(
          `Failed to parse XSD schema: ${errorMessage}. ` +
          `This may be due to unresolved external schema imports. ` +
          `The XSD schema contains external references that libxmljs2 cannot resolve. ` +
          `Ensure network access is available or provide all required schema files locally.`
        );
      }
      throw new Error(`Failed to parse XSD schema: ${errorMessage}`);
    }

    // Validate XML document against the XSD schema
    let isValid: boolean;
    try {
      isValid = xmlDoc.validate(xsdDoc);
    } catch (validateError) {
      const errorMessage = (validateError as Error).message;
      console.error('XSD validation method failed:', {
        error: errorMessage,
        errorName: (validateError as Error).name,
      });
      
      // If validate() throws "Invalid XSD schema", it means the schema document
      // is incomplete (likely due to unresolved external imports)
      if (errorMessage.includes('Invalid XSD schema') || errorMessage.includes('Invalid schema')) {
        throw new Error(
          `XSD schema is invalid or incomplete: ${errorMessage}. ` +
          `This is likely due to unresolved external schema imports. ` +
          `The XSD schema contains external references (xsd:import or xsd:include) ` +
          `that libxmljs2 cannot resolve automatically. ` +
          `All required schema files must be available locally or accessible via network.`
        );
      }
      throw validateError;
    }
    
    if (!isValid) {
      const errors = xmlDoc.validationErrors;
      console.error('XSD validation errors:', errors);
      return {
        isValid: false,
        issues: errors.map(err => ({
          severity: IssueSeverity.Error,
          message: err.message,
          lineNumber: err.line ?? undefined,
          // libxmljs2 does not directly provide xpath for XSD validation errors
          xpath: undefined,
        })),
      };
    }
    return { isValid: true, issues: [] };
  } catch (error) {
    console.error('XSD schema parsing or validation error:', error);
    const errorMessage = (error as Error).message;
    throw new Error(`Failed to validate XML against XSD: ${errorMessage}`);
  }
}
