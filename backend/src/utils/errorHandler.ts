// backend/src/utils/errorHandler.ts

import { NextResponse } from 'next/server';

export function handleError(error: unknown, context: string = 'API Error') {
  console.error(`[${context}]`, error);

  let message = 'An unexpected error occurred.';
  let statusCode = 500;

  if (error instanceof Error) {
    message = error.message;
    // You can add more specific error handling here, e.g., for validation errors
    // if (error instanceof ValidationError) {
    //   statusCode = 400;
    // }
  }

  return NextResponse.json({ message, details: (error as Error).stack }, { status: statusCode });
}
