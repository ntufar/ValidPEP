// backend/src/services/xmlParser.ts

import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { Issue, IssueSeverity } from '../types/validation';
import { spawn } from 'child_process';

// Dynamic import for xsd-schema-validator to avoid Turbopack build issues
// Note: xsd-schema-validator requires Java/JDK to be installed and will try to compile
// a Java helper class on first use. If Java is not available, we'll catch the error.
let xsdValidator: any;
let xsdValidatorError: Error | null = null;
let javaCheckPerformed = false;
let javaAvailable = false;

/**
 * Check if Java is available on the system
 */
async function checkJavaAvailability(): Promise<boolean> {
  if (javaCheckPerformed) {
    return javaAvailable;
  }
  
  javaCheckPerformed = true;
  
  return new Promise((resolve) => {
    // Check for javac (Java compiler) which is required by xsd-schema-validator
    const javaHome = process.env.JAVA_HOME;
    const javacPath = javaHome ? `${javaHome}/bin/javac` : 'javac';
    
    let resolved = false;
    
    const checkProcess = spawn(javacPath, ['-version'], {
      stdio: 'ignore',
      shell: true,
    });
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        checkProcess.kill();
        javaAvailable = false;
        resolve(false);
      }
    }, 2000);
    
    checkProcess.on('error', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        javaAvailable = false;
        resolve(false);
      }
    });
    
    checkProcess.on('exit', (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        javaAvailable = code === 0;
        resolve(javaAvailable);
      }
    });
  });
}

async function getXsdValidator() {
  if (xsdValidatorError) {
    throw xsdValidatorError;
  }
  
  // Check Java availability before importing
  const hasJava = await checkJavaAvailability();
  if (!hasJava) {
    xsdValidatorError = new Error(
      `XSD validator unavailable: Java/JDK is required but not available. ` +
      `The xsd-schema-validator package needs Java/JDK to compile and run a helper class. ` +
      `Please install Java or use an environment with Java available.`
    );
    throw xsdValidatorError;
  }
  
  if (!xsdValidator) {
    try {
      xsdValidator = await import('xsd-schema-validator');
    } catch (error) {
      const err = error as Error;
      xsdValidatorError = new Error(
        `XSD validator unavailable: ${err.message}. ` +
        `The xsd-schema-validator package requires Java/JDK to be installed. ` +
        `Please install Java or use an environment with Java available.`
      );
      throw xsdValidatorError;
    }
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
    // Note: This package requires Java/JDK and will try to compile a Java helper class
    const validatorModule = await getXsdValidator();
    
    // The package uses CommonJS: module.exports.validateXML
    return new Promise<{ isValid: boolean; issues: Issue[] }>((resolve, reject) => {
      // Handle CommonJS export (might be wrapped in default or direct)
      const validator = validatorModule.default || validatorModule;
      const validateXML = validator?.validateXML || validator;
      
      if (typeof validateXML !== 'function') {
        reject(new Error('Failed to load XSD validator: validateXML function not found'));
        return;
      }
      
      // Wrap the validation call to catch Java compilation errors
      try {
        validateXML(xmlString, xsdSchema, (err: any, result: any) => {
          if (err) {
            const errorMessage = err.message || String(err);
            
            // Check for Java-related errors
            if (
              errorMessage.includes('javac') ||
              errorMessage.includes('java') ||
              errorMessage.includes('JDK') ||
              errorMessage.includes('JAVA_HOME') ||
              errorMessage.includes('ENOENT') ||
              errorMessage.includes('spawn')
            ) {
              reject(
                new Error(
                  `XSD validation unavailable: Java runtime is required but not available. ` +
                  `The xsd-schema-validator package needs Java/JDK to compile and run a helper class. ` +
                  `Please install Java or use an environment with Java available. ` +
                  `Original error: ${errorMessage}`
                )
              );
              return;
            }
            
            // Check if it's a schema parsing issue (external imports, etc.)
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
      } catch (syncError) {
        const syncErrorMessage = (syncError as Error).message;
        if (
          syncErrorMessage.includes('javac') ||
          syncErrorMessage.includes('java') ||
          syncErrorMessage.includes('JDK') ||
          syncErrorMessage.includes('JAVA_HOME') ||
          syncErrorMessage.includes('ENOENT') ||
          syncErrorMessage.includes('spawn')
        ) {
          reject(
            new Error(
              `XSD validation unavailable: Java runtime is required but not available. ` +
              `The xsd-schema-validator package needs Java/JDK to compile and run a helper class. ` +
              `Please install Java or use an environment with Java available. ` +
              `Original error: ${syncErrorMessage}`
            )
          );
        } else {
          reject(syncError);
        }
      }
    });
  } catch (error) {
    // Error will be caught and handled by the route handler
    // which will convert known issues (external imports, Java errors, etc.) to warnings
    const errorMessage = (error as Error).message;
    
    // Check for Java-related errors
    if (
      errorMessage.includes('javac') ||
      errorMessage.includes('java') ||
      errorMessage.includes('JDK') ||
      errorMessage.includes('JAVA_HOME') ||
      errorMessage.includes('ENOENT') ||
      errorMessage.includes('spawn') ||
      errorMessage.includes('XSD validator unavailable')
    ) {
      throw new Error(
        `XSD validation unavailable: Java runtime is required but not available. ` +
        `The xsd-schema-validator package needs Java/JDK to compile and run a helper class. ` +
        `Please install Java or use an environment with Java available. ` +
        `Original error: ${errorMessage}`
      );
    }
    
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
