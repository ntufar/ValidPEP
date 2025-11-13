// backend/src/types/validation.ts

export enum IssueSeverity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

export interface Issue {
  severity: IssueSeverity;
  code?: string;
  message: string;
  xpath?: string;
  lineNumber?: number;
  suggestion?: string;
  specLink?: string;
}

export enum ValidationStatus {
  Uploading = 'Uploading',
  Parsing = 'Parsing',
  Validating = 'Validating',
  ValidatingSchema = 'Validating_Schema',
  ValidatingSchematron = 'Validating_Schematron',
  Validated = 'Validated',
  Invalid = 'Invalid',
}

export enum InvoiceFormat {
  UBL = 'ubl',
  CII = 'cii',
  Auto = 'auto',
}

export interface ValidationResult {
  id: string; // UUID
  invoiceId: string; // SHA256 Content Hash
  overallStatus: 'Valid' | 'Invalid';
  timestamp: string; // ISO 8601 date-time
  totalErrors: number;
  totalWarnings: number;
  totalInfos: number;
  issues: Issue[];
}

export interface ValidateRequest {
  file: string; // Base64 encoded XML content
  format?: InvoiceFormat;
  country?: string; // e.g., NO, SE, DK, NL, DE, auto
  options?: {
    includeWarnings?: boolean;
    includeXPath?: boolean;
  };
}

export interface ValidateResponse {
  valid: boolean;
  format: InvoiceFormat;
  version: string;
  country?: string;
  timestamp: string;
  errors: Issue[];
  warnings: Issue[];
  statistics: {
    totalLines: number;
    errorCount: number;
    warningCount: number;
  };
}
