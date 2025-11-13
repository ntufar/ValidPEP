import { NextResponse } from 'next/server';
import { handleError } from '../../../utils/errorHandler';
import { logger } from '../../../utils/logger';
import { ValidateResponse, IssueSeverity, InvoiceFormat } from '../../../types/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    logger.info('Received validation request', { body });

    // Mock validation logic and response for now
    const mockIssues: Issue[] = [
      {
        severity: IssueSeverity.Error,
        message: 'Mock Error: Invoice total mismatch.',
        xpath: '/Invoice/cac:LegalMonetaryTotal/cbc:PayableAmount',
        lineNumber: 25,
        suggestion: 'Recalculate total amount.',
        specLink: 'https://example.com/spec#total-mismatch',
      },
      {
        severity: IssueSeverity.Warning,
        message: 'Mock Warning: Missing buyer reference.',
        xpath: '/Invoice/cac:AccountingCustomerParty/cbc:Party/cbc:PartyLegalEntity/cbc:CompanyID',
        lineNumber: 15,
        suggestion: 'Add buyer reference.',
      },
    ];

    const mockResponse: ValidateResponse = {
      valid: false,
      format: InvoiceFormat.UBL,
      version: 'PEPPOL BIS Billing 3.0.19',
      country: 'NO',
      timestamp: new Date().toISOString(),
      errors: mockIssues.filter(issue => issue.severity === IssueSeverity.Error),
      warnings: mockIssues.filter(issue => issue.severity === IssueSeverity.Warning),
      statistics: {
        totalLines: 100,
        errorCount: mockIssues.filter(issue => issue.severity === IssueSeverity.Error).length,
        warningCount: mockIssues.filter(issue => issue.severity === IssueSeverity.Warning).length,
      },
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    return handleError(error, 'POST /api/validate');
  }
}
