import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Define the path to the favicon in the public directory
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
    
    // Read the file as a buffer
    const fileBuffer = fs.readFileSync(faviconPath);
    
    // Create a response with the file content
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving favicon:', error);
    return new NextResponse(null, { status: 500 });
  }
} 