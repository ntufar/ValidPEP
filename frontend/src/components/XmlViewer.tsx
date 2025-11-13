// frontend/src/components/XmlViewer.tsx

import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';

interface XmlViewerProps {
  xmlContent: string;
  highlightLine?: number;
}

const XmlViewer: React.FC<XmlViewerProps> = ({ xmlContent, highlightLine }) => {
  const editorRef = useRef<any>(null);

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor;
    if (highlightLine) {
      editor.revealLineInCenter(highlightLine);
      editor.deltaDecorations([], [
        {
          range: new monaco.Range(highlightLine, 1, highlightLine, 1),
          options: {
            isClassName: 'my-highlighted-line',
            overviewRuler: {
              color: 'yellow',
              position: monaco.editor.OverviewRulerLane.Full
            }
          }
        }
      ]);
    }
  }

  return (
    <div className="relative h-96 border border-gray-700 rounded-lg overflow-hidden">
      <Editor
        height="100%"
        language="xml"
        value={xmlContent}
        theme="vs-dark"
        options={{
          readOnly: true,
          domReadOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
};

export default XmlViewer;
