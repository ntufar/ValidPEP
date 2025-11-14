declare module 'xsd-schema-validator' {
  export interface ValidationResult {
    valid: boolean;
    errors?: Array<{
      message?: string;
      line?: number;
      path?: string;
    }>;
  }

  export function validateXML(
    xmlString: string,
    xsdSchema: string,
    callback: (err: Error | null, result?: ValidationResult) => void
  ): void;

  // CommonJS default export
  const validator: {
    validateXML: typeof validateXML;
  };
  export default validator;
}

