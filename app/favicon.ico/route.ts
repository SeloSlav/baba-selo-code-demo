import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Define the path to the favicon.ico in the public directory
    const faviconPath = join(process.cwd(), 'public', 'favicon.ico');
    
    // Read the file
    const favicon = readFileSync(faviconPath);
    
    // Return the favicon with appropriate headers
    return new NextResponse(favicon, {
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving favicon:', error);
    return new NextResponse('Error serving favicon', { status: 500 });
  }
} 