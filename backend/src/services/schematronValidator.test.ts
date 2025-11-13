import { validateXmlAgainstSchematron } from './schematronValidator';
import { IssueSeverity } from '../types/validation';

jest.mock('schematron-runner', () => ({
  validate: jest.fn(),
}));

const runSchematronValidateMock = jest.requireMock('schematron-runner')
  .validate as jest.Mock;

describe('schematronValidator', () => {
  beforeEach(() => {
    runSchematronValidateMock.mockReset();
  });

  it('returns validation success when no issues are reported', async () => {
    runSchematronValidateMock.mockResolvedValue({
      errors: [],
      warnings: [],
      ignored: [],
      passed: [],
    });

    const result = await validateXmlAgainstSchematron('<xml/>', '<sch/>');

    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('maps errors and warnings and flags invalid documents', async () => {
    runSchematronValidateMock.mockResolvedValue({
      errors: [
        {
          assertionId: 'E001',
          description: 'Error message',
          line: 12,
          path: '/Invoice',
          patternId: 'PATTERN_ERROR',
          ruleId: 'RULE_1',
          test: 'count(/Invoice) = 1',
          simplifiedTest: null,
          type: 'error',
          context: '/Invoice',
          xml: '<Invoice/>',
        },
      ],
      warnings: [
        {
          assertionId: 'W001',
          description: 'Warn message',
          line: 24,
          path: '/Invoice/Amount',
          patternId: 'PATTERN_WARN',
          ruleId: 'RULE_2',
          test: 'not(/Invoice/Amount < 0)',
          simplifiedTest: null,
          type: 'warning',
          context: '/Invoice/Amount',
          xml: '<Amount/>',
        },
      ],
      ignored: [],
      passed: [],
    });

    const result = await validateXmlAgainstSchematron('<xml/>', '<sch/>');

    expect(result.isValid).toBe(false);
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0]).toMatchObject({
      severity: IssueSeverity.Error,
      message: 'Error message',
      xpath: '/Invoice',
      lineNumber: 12,
      suggestion: 'count(/Invoice) = 1',
      code: 'E001',
    });
    expect(result.issues[1]).toMatchObject({
      severity: IssueSeverity.Warning,
      xpath: '/Invoice/Amount',
      code: 'W001',
    });
  });

  it('records ignored rules as info issues', async () => {
    runSchematronValidateMock.mockResolvedValue({
      errors: [],
      warnings: [],
      ignored: [
        {
          assertionId: 'IGN001',
          context: '/Invoice',
          errorMessage: 'Missing external document',
          patternId: 'PATTERN_IGN',
          ruleId: 'RULE_IGN',
          simplifiedTest: null,
          test: 'document("lookup.xml")',
          type: 'warning',
        },
      ],
      passed: [],
    });

    const result = await validateXmlAgainstSchematron('<xml/>', '<sch/>');

    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      severity: IssueSeverity.Info,
      message: expect.stringContaining('Schematron assertion skipped'),
      suggestion: 'document("lookup.xml")',
      code: 'IGN001',
    });
  });

  it('wraps schematron-runner errors', async () => {
    runSchematronValidateMock.mockRejectedValue(new Error('boom'));

    await expect(validateXmlAgainstSchematron('<xml/>', '<sch/>')).rejects.toThrow('Failed to validate XML against Schematron: boom');
  });
});

