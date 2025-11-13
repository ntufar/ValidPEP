// frontend/src/components/ErrorList.tsx

import React from 'react';
import { Issue, IssueSeverity } from '../types/validation';

interface ErrorListProps {
  issues: Issue[];
  onIssueClick?: (issue: Issue) => void;
}

const ErrorList: React.FC<ErrorListProps> = ({ issues, onIssueClick }) => {
  if (!issues || issues.length === 0) {
    return <p className="text-center text-gray-400">No issues found.</p>;
  }

  const getSeverityColor = (severity: IssueSeverity) => {
    switch (severity) {
      case IssueSeverity.Error:
        return 'text-red-400';
      case IssueSeverity.Warning:
        return 'text-yellow-400';
      case IssueSeverity.Info:
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      <h3 className="text-xl font-semibold mb-3">Validation Issues ({issues.length})</h3>
      <ul>
        {issues.map((issue, index) => (
          <li
            key={index}
            className={`mb-2 p-2 border border-gray-700 rounded-md cursor-pointer hover:bg-gray-700 transition-colors duration-150 ${getSeverityColor(issue.severity)}`}
            onClick={() => onIssueClick && onIssueClick(issue)}
          >
            <p className="font-medium">{issue.message}</p>
            {issue.lineNumber && <p className="text-sm text-gray-500">Line: {issue.lineNumber}</p>}
            {issue.xpath && <p className="text-sm text-gray-500">XPath: {issue.xpath}</p>}
            {issue.suggestion && <p className="text-sm text-gray-500">Suggestion: {issue.suggestion}</p>}
            {issue.specLink && (
              <a href={issue.specLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
                Spec Link
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ErrorList;
