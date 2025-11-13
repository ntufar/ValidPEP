import React, { useState, useCallback } from 'react';
import Dropzone from './components/Dropzone';
import ValidationProgress from './components/ValidationProgress';
import XmlViewer from './components/XmlViewer';
import ErrorList from './components/ErrorList';
import ValidationStatusBadge from './components/ValidationStatusBadge';
import ValidationSummary from './components/ValidationSummary';
import ValidationActions from './components/ValidationActions';
import { validateFile, readFileAsBase64 } from './utils/fileUtils';
import { validateInvoice } from './services/validationService';
import { ValidationStatus, ValidateResponse, Issue } from './types/validation';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus | null>(null);
  const [validationResult, setValidationResult] = useState<ValidateResponse | null>(null);
  const [highlightedLine, setHighlightedLine] = useState<number | undefined>(undefined);

  const handleFileAccepted = useCallback(async (acceptedFile: File) => {
    const { isValid, message } = validateFile(acceptedFile);
    if (!isValid) {
      setFile(null);
      setXmlContent(null);
      setValidationMessage(message || 'Invalid file.');
      setValidationStatus(null);
      setValidationResult(null);
      setHighlightedLine(undefined);
      console.error('File rejected:', message);
      return;
    }

    setFile(acceptedFile);
    setValidationMessage(null);
    setValidationResult(null);
    setHighlightedLine(undefined);
    setValidationStatus(ValidationStatus.Uploading);
    console.log('File accepted:', acceptedFile.name);

    try {
      const fileTextContent = await acceptedFile.text(); // Read as text for XmlViewer
      setXmlContent(fileTextContent);

      const base64Content = await readFileAsBase64(acceptedFile);
      // For now, we'll simulate progress updates.
      // In a real scenario, the backend would send progress updates.
      setValidationStatus(ValidationStatus.Parsing);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate parsing time

      setValidationStatus(ValidationStatus.ValidatingSchema);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate schema validation time

      setValidationStatus(ValidationStatus.ValidatingSchematron);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate schematron validation time

      const response = await validateInvoice({ file: base64Content });
      setValidationResult(response);
      setValidationStatus(response.valid ? ValidationStatus.Validated : ValidationStatus.Invalid);
      console.log('Validation response:', response);

    } catch (error) {
      setValidationStatus(ValidationStatus.Invalid);
      setValidationMessage(`Validation failed: ${(error as Error).message}`);
      console.error('Validation process error:', error);
    }
  }, []);

  const handleIssueClick = useCallback((issue: Issue) => {
    if (issue.lineNumber) {
      setHighlightedLine(issue.lineNumber);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">ValidPEP Validation Dashboard</h1>
      <div className="w-full max-w-4xl"> {/* Increased max-w for split view */}
        {!file && <Dropzone onFileAccepted={handleFileAccepted} />}
        {validationMessage && (
          <p className="text-red-500 mt-4 text-center">{validationMessage}</p>
        )}
        {validationStatus && !validationResult && (
          <ValidationProgress status={validationStatus} />
        )}

        {validationResult && (
          <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-center">Validation Results</h2>
            <div className="flex items-center justify-center space-x-4 mb-4">
              <ValidationStatusBadge isValid={validationResult.valid} />
              <p className="text-gray-400">Format: {validationResult.format.toUpperCase()}</p>
              <p className="text-gray-400">Version: {validationResult.version}</p>
            </div>
            <ValidationSummary
              errorCount={validationResult.statistics.errorCount}
              warningCount={validationResult.statistics.warningCount}
            />
            <div className="flex flex-col md:flex-row mt-6 space-y-4 md:space-y-0 md:space-x-4">
              <div className="md:w-1/2">
                <h3 className="text-xl font-semibold mb-2">XML Content</h3>
                {xmlContent && <XmlViewer xmlContent={xmlContent} highlightLine={highlightedLine} />}
              </div>
              <div className="md:w-1/2">
                <ErrorList issues={[...validationResult.errors, ...validationResult.warnings]} onIssueClick={handleIssueClick} />
              </div>
            </div>
            <ValidationActions validationResult={validationResult} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
