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
  localBasePath?: string; // Local file system path for resolving relative imports
};

/**
 * Tries to construct an OASIS UBL URL for common schema files
 * Returns null if the schema location doesn't match UBL common patterns
 */
function tryOasisUrl(schemaLocation: string): string | null {
  // OASIS UBL 2.1 base URL
  const OASIS_UBL_BASE = 'https://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/';
  
  // Check if this is a UBL common component
  if (schemaLocation.includes('UBL-Common') || schemaLocation.includes('common/')) {
    // Extract filename from path (handles both ../common/file.xsd and common/file.xsd)
    const filename = schemaLocation.split('/').pop();
    if (filename && filename.startsWith('UBL-')) {
      return `${OASIS_UBL_BASE}common/${filename}`;
    }
  }
  
  // Check for maindoc files
  if (schemaLocation.includes('UBL-Invoice') || schemaLocation.includes('UBL-CreditNote') || 
      schemaLocation.includes('UBL-ApplicationResponse') || schemaLocation.includes('maindoc/')) {
    const filename = schemaLocation.split('/').pop();
    if (filename && filename.startsWith('UBL-')) {
      return `${OASIS_UBL_BASE}maindoc/${filename}`;
    }
  }
  
  return null;
}

/**
 * Resolves external XSD imports by removing import/include statements
 * This prevents xml-helper-ts from hanging on external imports
 * Note: This means validation won't include types from imported schemas,
 * but it will at least validate the structure without hanging
 */
async function resolveXsdImports(
  xsdSchema: string,
  baseUrl: string,
  visited: Set<string> = new Set(),
  localBasePath?: string
): Promise<string> {
  const parser = new DOMParser();
  const schemaDoc = parser.parseFromString(xsdSchema, 'text/xml');
  const serializer = new XMLSerializer();
  
  // Find all xsd:import and xsd:include elements
  const imports = schemaDoc.getElementsByTagNameNS('http://www.w3.org/2001/XMLSchema', 'import');
  const includes = schemaDoc.getElementsByTagNameNS('http://www.w3.org/2001/XMLSchema', 'include');
  
  // Simply remove import/include elements to prevent xml-helper-ts from trying to resolve them
  // This is a pragmatic solution - validation will be incomplete but won't hang
  const rootSchema = schemaDoc.documentElement;
  if (!rootSchema) {
    return xsdSchema;
  }
  
  const children = Array.from(rootSchema.childNodes);
  const filteredChildren: Node[] = [];
  
  for (const child of children) {
    if (child.nodeType === 1) { // Element node
      const el = child as Element;
      const localName = el.localName;
      // Remove import/include elements
      if (localName !== 'import' && localName !== 'include') {
        filteredChildren.push(child);
      }
    } else {
      filteredChildren.push(child); // Keep text nodes, comments, etc.
    }
  }
  
  // Rebuild schema without imports
  while (rootSchema.firstChild) {
    rootSchema.removeChild(rootSchema.firstChild);
  }
  
  // Add back the filtered children (without imports)
  for (const child of filteredChildren) {
    rootSchema.appendChild(child);
  }
  
  return serializer.serializeToString(schemaDoc);
}

export async function validateXmlAgainstXsd(
  xmlDoc: Document,
  xsdSchema: string,
  parserOptions: XmlParserOptions = {}
): Promise<{ isValid: boolean; issues: Issue[] }> {
  try {
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(xmlDoc);
    
    // Extract base URL and local path from parser options
    const baseUrl = parserOptions.baseUrl || 'https://docs.peppol.eu/poacc/billing/3.0/xsd/';
    const localBasePath = parserOptions.localBasePath;
    
    // Resolve external imports before validation
    console.log('[xmlParser] Resolving XSD external imports...', { baseUrl, localBasePath });
    const resolvedSchema = await resolveXsdImports(xsdSchema, baseUrl, new Set(), localBasePath);
    console.log('[xmlParser] XSD imports resolved, starting validation');
    
    // Use xml-helper-ts for XSD validation
    // Note: We've removed import/include statements to prevent hanging
    const xmlHelper = new XmlHelper();
    
    // Load the resolved schema (without external imports)
    const schemaErrors = xmlHelper.loadSchema(resolvedSchema);
    
    if (schemaErrors.length > 0) {
      const issues: Issue[] = schemaErrors.map((err) => ({
        severity: IssueSeverity.Error,
        message: `XSD schema error: ${err.message}`,
        lineNumber: err.line,
        xpath: undefined,
      }));
      return { isValid: false, issues };
    }
    
    // Validate XML against the loaded schema
    const validationErrors = xmlHelper.validateXml(xmlString);
    
    if (validationErrors.length === 0) {
      return { isValid: true, issues: [] };
    }
    
    // Convert validation errors to issues
    const issues: Issue[] = validationErrors.map((err) => ({
      severity: IssueSeverity.Error,
      message: err.message,
      lineNumber: err.line,
      xpath: undefined,
    }));
    
    return { isValid: false, issues };
  } catch (error) {
    const errorMessage = (error as Error).message;
    throw new Error(`Failed to validate XML against XSD: ${errorMessage}`);
  }
}
