// frontend/src/components/ValidationActions.tsx

import React from 'react';
import type { ValidateResponse } from '../types/validation';
import { generateValidationCertificate } from '../utils/certificateGenerator';
// Placeholder for backend API calls
// import { generateJsonReport, generateHtmlReport } from '../../backend/src/services/reportGenerator';

interface ValidationActionsProps {
  validationResult: ValidateResponse;
  xmlContent: string | null;
}

const ValidationActions: React.FC<ValidationActionsProps> = ({ validationResult, xmlContent }) => {
  const handleDownloadCertificate = () => {
    const certificateContent = generateValidationCertificate(validationResult);
    const blob = new Blob([certificateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-certificate-${validationResult.timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Placeholder for backend API call to generate JSON report
  const fetchJsonReport = async (result: ValidateResponse): Promise<string> => {
    // In a real scenario, this would be a fetch call to a backend endpoint
    // For now, simulate by stringifying the result directly
    return JSON.stringify(result, null, 2);
  };

  // Placeholder for backend API call to generate HTML report
  const fetchHtmlReport = async (result: ValidateResponse): Promise<string> => {
    // In a real scenario, this would be a fetch call to a backend endpoint
    // For now, simulate by creating a simple HTML string
    const { valid, format, version, country, timestamp, errors, warnings, statistics } = result;
    const statusColor = valid ? 'green' : 'red';
    const statusText = valid ? 'Valid' : 'Invalid';

    const issueToHtml = (issue: any) => `
      <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-left: 5px solid ${issue.severity === 'error' ? 'red' : issue.severity === 'warning' ? 'orange' : 'blue'};">
        <p><strong>Severity:</strong> ${issue.severity}</p>
        <p><strong>Message:</strong> ${issue.message}</p>
        ${issue.code ? `<p><strong>Code:</strong> ${issue.code}</p>` : ''}
        ${issue.xpath ? `<p><strong>XPath:</strong> ${issue.xpath}</p>` : ''}
        ${issue.lineNumber ? `<p><strong>Line:</strong> ${issue.lineNumber}</p>` : ''}
        ${issue.suggestion ? `<p><strong>Suggestion:</strong> ${issue.suggestion}</p>` : ''}
        ${issue.specLink ? `<p><strong>Spec Link:</strong> <a href="${issue.specLink}" target="_blank">${issue.specLink}</a></p>` : ''}
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Validation Report - ${result.timestamp || 'N/A'}</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
              .container { max-width: 900px; margin: auto; background: #f9f9f9; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              h1, h2, h3 { color: #0056b3; }
              .status { font-size: 1.2em; font-weight: bold; color: ${statusColor}; }
              .section { margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; }
              ul { list-style-type: none; padding: 0; }
              li { margin-bottom: 5px; }
              a { color: #0056b3; text-decoration: none; }
              a:hover { text-decoration: underline; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Validation Report</h1>
              <p><strong>Overall Status:</strong> <span class="status">${statusText}</span></p>
              <p><strong>Format:</strong> ${format.toUpperCase()}</p>
              <p><strong>Version:</strong> ${version}</p>
              <p><strong>Country:</strong> ${country || 'N/A'}</p>
              <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>

              <div class="section">
                  <h2>Statistics</h2>
                  <ul>
                      <li><strong>Total Lines:</strong> ${statistics.totalLines}</li>
                      <li><strong>Errors:</strong> ${statistics.errorCount}</li>
                      <li><strong>Warnings:</strong> ${statistics.warningCount}</li>
                  </ul>
              </div>

              ${errors.length > 0 ? `
              <div class="section">
                  <h2>Errors (${errors.length})</h2>
                  ${errors.map(issueToHtml).join('')}
              </div>` : ''}

              ${warnings.length > 0 ? `
              <div class="section">
                  <h2>Warnings (${warnings.length})</h2>
                  ${warnings.map(issueToHtml).join('')}
              </div>` : ''}

              ${(() => {
                const allIssues = [...result.errors, ...result.warnings];
                const infoIssues = allIssues.filter(issue => {
                  const severity = typeof issue.severity === 'string' ? issue.severity : String(issue.severity);
                  return severity === 'info';
                });
                return infoIssues.length > 0 ? `
              <div class="section">
                  <h2>Information (${infoIssues.length})</h2>
                  ${infoIssues.map(issueToHtml).join('')}
              </div>` : '';
              })()}
          </div>
      </body>
      </html>
    `;
  };

  const handleDownloadJsonReport = async () => {
    const jsonContent = await fetchJsonReport(validationResult);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-report-${validationResult.timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtmlReport = async () => {
    const htmlContent = await fetchHtmlReport(validationResult);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-report-${validationResult.timestamp}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const { valid, format, version, country, errors, warnings, statistics } = validationResult;
    let summary = `Validation Summary:\n`;
    summary += `Status: ${valid ? 'Valid' : 'Invalid'}\n`;
    summary += `Format: ${format.toUpperCase()}\n`;
    summary += `Version: ${version}\n`;
    summary += `Country: ${country || 'N/A'}\n`;
    summary += `Errors: ${statistics.errorCount}\n`;
    summary += `Warnings: ${statistics.warningCount}\n`;

    if (errors.length > 0) {
      summary += `\nTop Errors:\n`;
      errors.slice(0, 3).forEach((err, index) => {
        summary += `  ${index + 1}. ${err.message} (Line: ${err.lineNumber || 'N/A'})\n`;
      });
    }
    if (warnings.length > 0) {
      summary += `\nTop Warnings:\n`;
      warnings.slice(0, 3).forEach((warn, index) => {
        summary += `  ${index + 1}. ${warn.message} (Line: ${warn.lineNumber || 'N/A'})\n`;
      });
    }

    navigator.clipboard.writeText(summary)
      .then(() => alert('Validation summary copied to clipboard!'))
      .catch(err => console.error('Failed to copy summary:', err));
  };

  const handleExportAnnotatedXml = () => {
    if (!xmlContent) {
      alert('No XML content to annotate.');
      return;
    }

    const annotation = `<!-- Validation Status: ${validationResult.valid ? 'Valid' : 'Invalid'} (Errors: ${validationResult.statistics.errorCount}, Warnings: ${validationResult.statistics.warningCount}) -->\n`;
    const annotatedXml = annotation + xmlContent;

    const blob = new Blob([annotatedXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotated-invoice-${validationResult.timestamp}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 flex justify-center space-x-4">
      {validationResult.valid && (
        <button
          onClick={handleDownloadCertificate}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
        >
          Download Certificate
        </button>
      )}
      <button
        onClick={handleDownloadJsonReport}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
      >
        Download JSON Report
      </button>
      <button
        onClick={handleDownloadHtmlReport}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
      >
        Download HTML Report
      </button>
      <button
        onClick={handleCopySummary}
        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
      >
        Copy Summary
      </button>
      <button
        onClick={handleExportAnnotatedXml}
        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
      >
        Export Annotated XML
      </button>
    </div>
  );
};

export default ValidationActions;
