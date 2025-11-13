import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const EXAMPLES_DIR = path.join(process.cwd(), 'public', 'examples');
const EXAMPLES_DIR_PREFIX = EXAMPLES_DIR + path.sep;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (filename) {
      if (filename.trim().length === 0) {
        return NextResponse.json({ message: 'Invalid filename provided.' }, { status: 400 });
      }
      if (filename.includes('..') || path.isAbsolute(filename)) {
        return NextResponse.json({ message: 'Invalid filename provided.' }, { status: 400 });
      }

      const filePath = path.resolve(EXAMPLES_DIR, filename);
      if (!filePath.startsWith(EXAMPLES_DIR_PREFIX)) {
        return NextResponse.json({ message: 'Invalid filename provided.' }, { status: 400 });
      }

      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        return new NextResponse(fileContent, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      } catch (error) {
        return NextResponse.json({ message: `File not found: ${filename}` }, { status: 404 });
      }
    } else {
      // List all example files
      const files = await fs.readdir(EXAMPLES_DIR);
      const xmlFiles = files.filter(file => file.endsWith('.xml'));
      return NextResponse.json(xmlFiles);
    }
  } catch (error) {
    console.error('Error serving example invoices:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
