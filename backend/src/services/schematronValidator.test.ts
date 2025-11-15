import { validateXmlAgainstSchematron } from './schematronValidator';

describe('schematronValidator', () => {
  it('throws an error explaining that Schematron validation is not available in serverless environments', async () => {
    await expect(validateXmlAgainstSchematron('<xml/>', '<sch/>')).rejects.toThrow(
      'Schematron validation unavailable: This feature requires Java runtime, ' +
      'which is not available in serverless environments like Vercel.'
    );
  });

  it('provides helpful error message about how to enable Schematron validation', async () => {
    try {
      await validateXmlAgainstSchematron('<xml/>', '<sch/>');
      fail('Should have thrown an error');
    } catch (error) {
      const errorMessage = (error as Error).message;
      expect(errorMessage).toContain('Java runtime');
      expect(errorMessage).toContain('serverless environments');
      expect(errorMessage).toContain('XSD validation has been completed successfully');
      expect(errorMessage).toContain('deploy to an environment with Java installed');
    }
  });
});

