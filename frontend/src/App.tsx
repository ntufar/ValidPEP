import { useState, useCallback, useEffect } from 'react';
import Dropzone from './components/Dropzone';
import ValidationProgress from './components/ValidationProgress';
import XmlViewer from './components/XmlViewer';
import ErrorList from './components/ErrorList';
import ValidationStatusBadge from './components/ValidationStatusBadge';
import ValidationSummary from './components/ValidationSummary';
import ValidationActions from './components/ValidationActions';
import ValidationOptions from './components/ValidationOptions';
import ThemeToggle from './components/ThemeToggle';
import { validateFile, readFileAsBase64, fetchFileFromUrl } from './utils/fileUtils';
import { validateInvoice } from './services/validationService';
import type { ValidationStatus, ValidateResponse, Issue } from './types';
import { initializeKeyboardShortcuts, cleanupKeyboardShortcuts, registerShortcut } from './utils/keyboardShortcuts';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus | null>(null);
  const [validationResult, setValidationResult] = useState<ValidateResponse | null>(null);
  const [highlightedLine, setHighlightedLine] = useState<number | undefined>(undefined);
  const [selectedCountry, setSelectedCountry] = useState<string>('auto');
  const [urlInput, setUrlInput] = useState<string>('');

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
    setValidationStatus('Uploading');
    console.log('File accepted:', acceptedFile.name);

    try {
      const fileTextContent = await acceptedFile.text();
      setXmlContent(fileTextContent);

      const base64Content = await readFileAsBase64(acceptedFile);
      console.log('Base64 content length:', base64Content.length);
      console.log('First 100 chars of Base64 content:', base64Content.substring(0, 100));
      setValidationStatus('Parsing');

      setValidationStatus('Validating');
      const response = await validateInvoice({ file: base64Content, country: selectedCountry });
      setValidationResult(response);
      setValidationStatus(response.valid ? 'Validated' : 'Invalid');
      console.log('Validation response:', response);

    } catch (error) {
      setValidationStatus('Invalid');
      setValidationResult(null);
      setValidationMessage(`Validation failed: ${(error as Error).message}`);
      console.error('Validation process error:', error);
    }
  }, [selectedCountry]);

  const handleUrlValidation = useCallback(async () => {
    if (!urlInput) {
      setValidationMessage('Please enter a URL.');
      return;
    }

    setValidationMessage(null);
    setValidationResult(null);
    setHighlightedLine(undefined);
    setValidationStatus('Uploading');

    const { file: fetchedFile, message } = await fetchFileFromUrl(urlInput);

    if (fetchedFile) {
      handleFileAccepted(fetchedFile);
    } else {
      setValidationStatus('Invalid');
      setValidationResult(null);
      setValidationMessage(message || 'Failed to fetch file from URL.');
      console.error('URL fetch error:', message);
    }
  }, [urlInput, handleFileAccepted]);

  const handleIssueClick = useCallback((issue: Issue) => {
    if (issue.lineNumber) {
      setHighlightedLine(issue.lineNumber);
    }
  }, []);

  useEffect(() => {
    initializeKeyboardShortcuts();

    const validateShortcut = {
      key: 'v',
      ctrlKey: true,
      handler: () => {
        if (urlInput) {
          handleUrlValidation();
        } else if (file) {
          // In a real scenario, you might trigger a re-validation of the existing file
          // For now, we'll just log a message.
          console.log('Ctrl+V pressed, but no URL to validate. File re-validation not implemented yet.');
        } else {
          setValidationMessage('No file or URL to validate.');
        }
      },
    };

    registerShortcut(validateShortcut);

    // Placeholder for file upload shortcut (e.g., Ctrl+U)
    // This would typically involve opening a file dialog, which is not directly
    // controllable via a simple keyboard shortcut handler.
    // const uploadShortcut = {
    //   key: 'u',
    //   ctrlKey: true,
    //   handler: () => {
    //     console.log('Ctrl+U pressed - file upload shortcut triggered.');
    //     // Trigger file input click or similar
    //   },
    // };
    // registerShortcut(uploadShortcut);


    return () => {
      cleanupKeyboardShortcuts();
      // unregisterShortcut(validateShortcut);
      // unregisterShortcut(uploadShortcut);
    };
  }, [urlInput, file, handleUrlValidation]); // Dependencies for useEffect

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-full sm:max-w-xl md:max-w-4xl lg:max-w-6xl flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">ValidPEP Validation Dashboard</h1>
        <ThemeToggle />
      </div>
      <div className="w-full max-w-full sm:max-w-xl md:max-w-4xl lg:max-w-6xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="xml-url-input" className="sr-only">XML URL</label>
            <input
              id="xml-url-input"
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter XML URL"
              className="flex-grow p-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleUrlValidation}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Validate from URL
            </button>
          </div>
          <ValidationOptions selectedCountry={selectedCountry} onCountryChange={setSelectedCountry} />
        </div>
        {!file && !validationStatus && (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-xl mb-2">Upload an XML file or provide a URL to start validation.</p>
            <p className="text-md">Supported formats: PEPPOL BIS Billing UBL/CII</p>
          </div>
        )}
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
            <ValidationActions validationResult={validationResult} xmlContent={xmlContent} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
