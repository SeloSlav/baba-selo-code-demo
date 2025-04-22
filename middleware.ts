import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Minimal middleware function to allow all requests through for testing
// export function middleware(request: NextRequest) {
//   return NextResponse.next()
// }

// Optional: You can keep a minimal config or comment it out entirely
// export const config = {
//   matcher: '/:path*', // Or keep the more specific matcher if preferred
// };

// --- Original Middleware Code (Restored with Logging) ---

// Extend NextRequest to include Vercel-specific geo information
declare module 'next/server' {
  interface NextRequest {
    geo?: {
      country?: string;
      city?: string;
      region?: string;
    }
  }
}

// Allowed country codes (ISO 3166-1 alpha-2)
const ALLOWED_COUNTRIES = ['US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'SE', 'PL', 'RO', 'BE', 'CZ', 'GR', 'PT', 'HU', 'IE', 'DK', 'FI', 'SK', 'BG', 'HR', 'LT', 'SI', 'LV', 'EE', 'LU', 'MT', 'CY', 'AE']

export function middleware(request: NextRequest) {
  console.log(`[Middleware V2] Request URL: ${request.url}`);
  
  // Skip geo-restriction for static files and in development environment
  const url = new URL(request.url)
  const isDev = process.env.NODE_ENV === 'development'
  const isStaticFile = /\.(js|css|png|jpg|jpeg|svg|ico|webmanifest|json|woff2|woff|ttf)$/i.test(url.pathname)
  
  // Skip geo-check for static files or in development mode
  if (isStaticFile || isDev) {
    console.log(`[Middleware V2] Skipping: Static file or Dev environment.`);
    return NextResponse.next()
  }

  console.log("[Middleware V2] Attempting to access geo data...");
  let geo;
  let country = 'XX'; // Default
  try {
      geo = request.geo;
      country = geo?.country || 'XX';
      console.log(`[Middleware V2] Geo data accessed: ${JSON.stringify(geo)}, Determined Country: ${country}`);
  } catch (e) {
      console.error(`[Middleware V2] Error accessing geo data: ${e}`);
      // If accessing geo fails, maybe deny access? Or allow? For now, let's deny.
      country = 'XX_ERROR'; 
      console.log(`[Middleware V2] Country set to XX_ERROR due to exception.`);
  }

  if (!ALLOWED_COUNTRIES.includes(country)) {
    console.log(`[Middleware V2] Access Denied for country: ${country}. Returning 403.`);
    // TEST: Return direct 403 instead of rewrite
    return new NextResponse(`Access Denied via Middleware for country: ${country}`, { 
        status: 403,
        headers: { 'Content-Type': 'text/plain' } 
    });
  }

  console.log(`[Middleware V2] Access Allowed for country: ${country}. Proceeding.`);
  return NextResponse.next()
}

// Original config
export const config = {
  matcher: [
    // Match all paths
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|apple-touch-icon.png).*)',
  ],
} 