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
    const xsdDoc = libxmljs2.parseXml(xsdSchema, {
      nonet: false,
      ...parserOptions,
    });
    const isValid = xmlDoc.validate(xsdDoc);
    if (!isValid) {
      const errors = xmlDoc.validationErrors;
      console.error('XSD validation errors:', errors);
      return {
        isValid: false,
        issues: errors.map(err => ({
          severity: IssueSeverity.Error,
          message: err.message,
          lineNumber: err.line,
          // libxmljs2 does not directly provide xpath for XSD validation errors
          xpath: undefined,
        })),
      };
    }
    return { isValid: true, issues: [] };
  } catch (error) {
    console.error('XSD schema parsing or validation error:', error);
    throw new Error('Failed to validate XML against XSD: ' + (error as Error).message);
  }
}
