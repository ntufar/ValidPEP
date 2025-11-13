// backend/src/services/xmlParser.ts

import { libxmljs2 } from 'libxmljs2';

export function parseXml(xmlString: string) {
  try {
    return libxmljs2.parseXml(xmlString);
  } catch (error) {
    console.error('XML parsing error:', error);
    throw new Error('Failed to parse XML: ' + (error as Error).message);
  }
}

export function validateXmlAgainstXsd(xmlDoc: libxmljs2.Document, xsdSchema: string) {
  try {
    const xsdDoc = libxmljs2.parseXml(xsdSchema);
    const isValid = xmlDoc.validate(xsdDoc);
    if (!isValid) {
      const errors = xmlDoc.validationErrors;
      console.error('XSD validation errors:', errors);
      return { isValid: false, errors: errors.map(err => ({ message: err.message, line: err.line })) };
    }
    return { isValid: true, errors: [] };
  } catch (error) {
    console.error('XSD schema parsing or validation error:', error);
    throw new Error('Failed to validate XML against XSD: ' + (error as Error).message);
  }
}
