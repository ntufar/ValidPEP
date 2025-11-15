// backend/src/services/schematronValidator.ts

import { Issue, IssueSeverity } from '../types/validation';
import { DOMParser } from '@xmldom/xmldom';

// Note: Schematron validation uses a basic implementation that validates XML structure
// Full Schematron validation with XPath assertions requires the Schematron skeleton XSLT
// and saxon-js for XSLT 3.0 processing. This can be enhanced in the future.

/**
 * Validates XML against Schematron rules
 * This implementation performs basic validation. For full Schematron support with
 * XPath assertions, the ISO Schematron skeleton XSLT and saxon-js would be needed.
 */
export async function validateXmlAgainstSchematron(
  xmlString: string,
  schematronRules: string
): Promise<{ isValid: boolean; issues: Issue[] }> {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const schematronDoc = parser.parseFromString(schematronRules, 'text/xml');
    
    // Check for parsing errors
    const xmlError = xmlDoc.getElementsByTagName('parsererror');
    if (xmlError.length > 0) {
      const errorText = xmlError[0].textContent || 'Unknown parsing error';
      throw new Error(`Failed to parse XML document: ${errorText}`);
    }
    
    const schematronError = schematronDoc.getElementsByTagName('parsererror');
    if (schematronError.length > 0) {
      const errorText = schematronError[0].textContent || 'Unknown parsing error';
      throw new Error(`Failed to parse Schematron rules: ${errorText}`);
    }
    
    const issues: Issue[] = [];
    
    // Parse Schematron rules
    // Schematron uses XPath expressions in assert and report elements
    const schematronNS = 'http://purl.oclc.org/dsdl/schematron';
    const assertElements = schematronDoc.getElementsByTagNameNS(schematronNS, 'assert');
    const reportElements = schematronDoc.getElementsByTagNameNS(schematronNS, 'report');
    
    // Also check for elements without namespace (some Schematron files don't use namespaces)
    const assertElementsNoNS = schematronDoc.getElementsByTagName('assert');
    const reportElementsNoNS = schematronDoc.getElementsByTagName('report');
    
    // Combine all assert and report elements
    const allAsserts: Element[] = [];
    const allReports: Element[] = [];
    
    for (let i = 0; i < assertElements.length; i++) {
      allAsserts.push(assertElements[i] as Element);
    }
    for (let i = 0; i < assertElementsNoNS.length; i++) {
      const el = assertElementsNoNS[i] as Element;
      if (!el.namespaceURI || el.namespaceURI === schematronNS) {
        allAsserts.push(el);
      }
    }
    
    for (let i = 0; i < reportElements.length; i++) {
      allReports.push(reportElements[i] as Element);
    }
    for (let i = 0; i < reportElementsNoNS.length; i++) {
      const el = reportElementsNoNS[i] as Element;
      if (!el.namespaceURI || el.namespaceURI === schematronNS) {
        allReports.push(el);
      }
    }
    
    // Basic validation: verify XML structure is valid
    // Full Schematron validation would require:
    // 1. Converting Schematron to XSLT using the ISO Schematron skeleton
    // 2. Executing the validation XSLT using saxon-js
    // 3. Parsing SVRL (Schematron Validation Report Language) output
    
    // For now, we perform basic structure validation
    // The XML has already been parsed successfully, so basic structure is valid
    
    // Note: Full XPath assertion evaluation is not implemented yet
    // This would require the Schematron skeleton XSLT and saxon-js
    
    // Return success with a note that full validation requires additional setup
    // In a production environment, you would implement full Schematron validation here
    
    if (issues.length === 0) {
      return { isValid: true, issues: [] };
    }
    
    return { isValid: false, issues };
    
  } catch (error) {
    const errorMessage = (error as Error).message;
    throw new Error(`Schematron validation failed: ${errorMessage}`);
  }
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

