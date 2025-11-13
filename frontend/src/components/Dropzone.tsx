// frontend/src/components/Dropzone.tsx

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface DropzoneProps {
  onFileAccepted: (file: File) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFileAccepted }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsDragActive(false);
    if (acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles[0]);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'application/xml': ['.xml'],
      'text/xml': ['.xml'],
    },
    maxFiles: 1,
  });

  const borderColor = isDragAccept ? 'border-green-500' : isDragReject ? 'border-red-500' : 'border-gray-400';

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${borderColor} ${isDragActive ? 'bg-gray-700' : 'bg-gray-800'}`}
    >
      <input {...getInputProps()} />
      {isDragAccept && <p className="text-green-500">Drop the XML file here ...</p>}
      {isDragReject && <p className="text-red-500">Only .xml files are accepted</p>}
      {!isDragActive && <p className="text-gray-400">Drag 'n' drop an XML file here, or click to select file</p>}
      <p className="text-sm text-gray-500 mt-2">Max file size: 10MB</p>
    </div>
  );
};

export default Dropzone;
