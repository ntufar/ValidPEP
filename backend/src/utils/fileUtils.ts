// frontend/src/utils/fileUtils.ts

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ['application/xml', 'text/xml'];

export function validateFile(file: File): { isValid: boolean; message?: string } {
  if (!file) {
    return { isValid: false, message: 'No file provided.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE_MB}MB.` };
  }

  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return { isValid: false, message: 'Only .xml files are accepted.' };
  }

  return { isValid: true };
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1]; // Get base64 part
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function fetchFileFromUrl(url: string): Promise<{ file: File | null; message?: string }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { file: null, message: `Failed to fetch URL: ${response.statusText}` };
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType || !ACCEPTED_FILE_TYPES.some(type => contentType.includes(type))) {
      return { file: null, message: 'Fetched content is not an accepted XML type.' };
    }

    const blob = await response.blob();
    if (blob.size > MAX_FILE_SIZE_BYTES) {
      return { file: null, message: `Fetched file size exceeds the maximum limit of ${MAX_FILE_SIZE_MB}MB.` };
    }

    // Create a File object from the Blob
    const filename = url.substring(url.lastIndexOf('/') + 1) || 'downloaded_file.xml';
    const file = new File([blob], filename, { type: contentType });

    return { file, message: undefined };
  } catch (error) {
    console.error('Error fetching file from URL:', error);
    return { file: null, message: `Error fetching file from URL: ${(error as Error).message}` };
  }
}
