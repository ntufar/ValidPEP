// backend/src/services/reportGenerator.ts

import { ValidateResponse, IssueSeverity } from '../types/validation';

export function generateJsonReport(validationResult: ValidateResponse): string {
  return JSON.stringify(validationResult, null, 2);
}

export function generateHtmlReport(validationResult: ValidateResponse): string {
  const { valid, format, version, country, timestamp, errors, warnings, statistics } = validationResult;

  const statusColor = valid ? 'green' : 'red';
  const statusText = valid ? 'Valid' : 'Invalid';

  const issueToHtml = (issue: any) => `
    <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-left: 5px solid ${issue.severity === IssueSeverity.Error ? 'red' : issue.severity === IssueSeverity.Warning ? 'orange' : 'blue'};">
      <p><strong>Severity:</strong> ${issue.severity}</p>
      <p><strong>Message:</strong> ${issue.message}</p>
      ${issue.code ? `<p><strong>Code:</strong> ${issue.code}</p>` : ''}
      ${issue.xpath ? `<p><strong>XPath:</strong> ${issue.xpath}</p>` : ''}
      ${issue.lineNumber ? `<p><strong>Line:</strong> ${issue.lineNumber}</p>` : ''}
      ${issue.suggestion ? `<p><strong>Suggestion:</strong> ${issue.suggestion}</p>` : ''}
      ${issue.specLink ? `<p><strong>Spec Link:</strong> <a href="${issue.specLink}" target="_blank">${issue.specLink}</a></p>` : ''}
    </div>
  `;

  const allIssues = [...errors, ...warnings];

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Validation Report</title>
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
        </div>
    </body>
    </html>
  `;
}
